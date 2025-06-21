/**
 * Cloudflare AI Provider
 * Implements the AIProvider interface for Cloudflare Workers AI
 */
import { AIProviderError, AIRateLimitError } from '../types.js';
export class CloudflareAIProvider {
    name = 'cloudflare';
    accountId;
    apiToken;
    modelId;
    baseUrl;
    maxRetries;
    timeout;
    constructor(config) {
        this.accountId = config.accountId;
        this.apiToken = config.apiToken;
        this.modelId = config.modelId;
        this.baseUrl = config.baseUrl || 'https://api.cloudflare.com/client/v4/accounts';
        this.maxRetries = config.maxRetries || 3;
        this.timeout = config.timeout || 30000;
    }
    async generateText(messages, options) {
        const response = await this.makeRequest(messages, { ...options, stream: false });
        return this.parseResponse(response);
    }
    async *generateStream(messages, options) {
        const response = await this.makeRequest(messages, { ...options, stream: true });
        if (!response.body) {
            throw new AIProviderError('No response body for streaming', this.name);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            yield { content: fullContent, done: true, delta: '' };
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            // Cloudflare AI response format may differ from OpenAI
                            const delta = parsed.response || parsed.text || '';
                            fullContent += delta;
                            yield {
                                content: fullContent,
                                delta,
                                done: false
                            };
                        }
                        catch {
                            // Skip malformed JSON
                            continue;
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async isAvailable() {
        try {
            // For Cloudflare AI, we can check if we're in a worker environment
            // or if we have the necessary credentials
            if (typeof globalThis.AI !== 'undefined') {
                return true; // Running in Cloudflare Worker with AI binding
            }
            if (this.accountId && this.apiToken) {
                // Test API connectivity
                const response = await fetch(`${this.baseUrl}/${this.accountId}/ai/models/list`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`,
                    },
                    signal: AbortSignal.timeout(5000)
                });
                return response.ok;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    async makeRequest(messages, options) {
        // Check if we're in a Cloudflare Worker environment
        if (typeof globalThis.AI !== 'undefined') {
            return this.makeWorkerRequest(messages, options);
        }
        // External API request
        return this.makeExternalRequest(messages, options);
    }
    async makeWorkerRequest(messages, options) {
        const AI = globalThis.AI;
        // Convert messages to Cloudflare AI format
        const prompt = this.formatMessages(messages);
        const response = await AI.run(this.modelId, {
            prompt,
            max_tokens: options?.maxTokens || 2048,
            temperature: options?.temperature || 0.1,
            stream: options?.stream || false
        });
        // Convert AI response to Response object
        return new Response(JSON.stringify({
            result: {
                response: typeof response === 'string' ? response : response.response
            },
            success: true
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    async makeExternalRequest(messages, options) {
        if (!this.accountId || !this.apiToken) {
            throw new AIProviderError('Account ID and API token are required for external requests', this.name);
        }
        const body = {
            prompt: this.formatMessages(messages),
            max_tokens: options?.maxTokens || 2048,
            temperature: options?.temperature || 0.1,
            stream: options?.stream || false
        };
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiToken}`
        };
        let lastError = null;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}/${this.accountId}/ai/run/${this.modelId}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(this.timeout)
                });
                if (response.ok) {
                    return response;
                }
                // Handle specific error codes
                if (response.status === 429) {
                    const retryAfter = response.headers.get('retry-after');
                    throw new AIRateLimitError('Rate limit exceeded', this.name, retryAfter ? parseInt(retryAfter) : undefined);
                }
                if (response.status === 401) {
                    throw new AIProviderError('Authentication failed', this.name);
                }
                if (response.status === 404) {
                    throw new AIProviderError(`Model ${this.modelId} not found`, this.name);
                }
                const errorText = await response.text();
                throw new AIProviderError(`API request failed: ${response.status} ${errorText}`, this.name);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Don't retry on authentication or not found errors
                if (error instanceof AIProviderError &&
                    (error.message.includes('Authentication') || error.message.includes('not found'))) {
                    throw error;
                }
                // Don't retry on rate limit errors
                if (error instanceof AIRateLimitError) {
                    throw error;
                }
                // Wait before retry
                if (attempt < this.maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        throw new AIProviderError(`Request failed after ${this.maxRetries} attempts: ${lastError?.message}`, this.name, lastError || undefined);
    }
    formatMessages(messages) {
        // Convert OpenAI-style messages to a single prompt
        return messages.map(msg => {
            switch (msg.role) {
                case 'system':
                    return `System: ${msg.content}`;
                case 'user':
                    return `Human: ${msg.content}`;
                case 'assistant':
                    return `Assistant: ${msg.content}`;
                default:
                    return msg.content;
            }
        }).join('\n\n');
    }
    async parseResponse(response) {
        const data = await response.json();
        // Handle Cloudflare AI response format
        if (data.success) {
            const result = data.result;
            const content = result.response || result.text || '';
            return {
                content,
                model: this.modelId,
                finishReason: 'stop'
            };
        }
        else {
            throw new AIProviderError(`Cloudflare AI error: ${data.errors?.[0]?.message || 'Unknown error'}`, this.name);
        }
    }
}
