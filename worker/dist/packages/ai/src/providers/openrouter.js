/**
 * OpenRouter AI Provider
 * Implements the AIProvider interface for OpenRouter API
 */
import { AIProviderError, AIRateLimitError } from '../types.js';
export class OpenRouterProvider {
    name = 'openrouter';
    apiKey;
    baseUrl;
    modelId;
    maxRetries;
    timeout;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
        this.modelId = config.modelId;
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
                            yield { content: '', done: true, delta: '' };
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta?.content || '';
                            yield {
                                content: delta,
                                delta,
                                done: false,
                                usage: parsed.usage
                            };
                        }
                        catch (e) {
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
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async makeRequest(messages, options) {
        const body = {
            model: this.modelId,
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            max_tokens: options?.maxTokens || 2048,
            temperature: options?.temperature || 0.1,
            top_p: options?.topP,
            presence_penalty: options?.presencePenalty,
            frequency_penalty: options?.frequencyPenalty,
            stop: options?.stop,
            stream: options?.stream || false
        };
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://finance-manager.irfandi.id',
            'X-Title': 'Finance Manager'
        };
        let lastError = null;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
    parseResponse(response) {
        return response.json().then((data) => {
            const choice = data.choices?.[0];
            if (!choice) {
                throw new AIProviderError('No completion choices in response', this.name);
            }
            return {
                content: choice.message?.content || '',
                usage: data.usage ? {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens
                } : undefined,
                model: data.model,
                finishReason: choice.finish_reason
            };
        });
    }
}
