export { renderers } from '../../renderers.mjs';

/**
 * AI Model Configuration for Finance Manager
 * Supports OpenRouter and Cloudflare AI providers
 */
// Default AI model configuration matching user preferences
const DEFAULT_AI_CONFIG = {
    // Primary: Flash 2.5 (Gemini Flash 2.0-exp)
    primary: {
        provider: 'openrouter',
        modelId: 'google/gemini-flash-1.5',
        baseUrl: 'https://openrouter.ai/api/v1',
        maxTokens: 4096,
        temperature: 0.1, // Low temperature for financial accuracy
    },
    // Fallback: GPT-4o-mini (cheap & fast)
    fallback: {
        provider: 'openrouter',
        modelId: 'openai/gpt-4o-mini',
        baseUrl: 'https://openrouter.ai/api/v1',
        maxTokens: 4096,
        temperature: 0.1,
    },
    // Research: Claude 3.5 Haiku (for complex analysis)
    research: {
        provider: 'openrouter',
        modelId: 'anthropic/claude-3.5-haiku',
        baseUrl: 'https://openrouter.ai/api/v1',
        maxTokens: 4096,
        temperature: 0.2,
    }
};
// Model capabilities for different use cases
const AI_USE_CASES = {
    TRANSACTION_ANALYSIS: {
        prompt: 'Analyze this financial transaction for accuracy and compliance:',
        maxTokens: 2048,
        temperature: 0.05, // Very low for accuracy
    },
    EXPENSE_CATEGORIZATION: {
        prompt: 'Categorize this expense according to standard accounting principles:',
        maxTokens: 1024,
        temperature: 0.1,
    },
    FINANCIAL_INSIGHTS: {
        prompt: 'Provide financial insights and recommendations based on this data:',
        maxTokens: 4096,
        temperature: 0.3, // Higher for creative insights
    },
    REPORT_GENERATION: {
        prompt: 'Generate a financial report summary:',
        maxTokens: 3072,
        temperature: 0.2,
    },
    COMPLIANCE_CHECK: {
        prompt: 'Check this financial data for compliance and potential issues:',
        maxTokens: 2048,
        temperature: 0.05,
    }
};

/**
 * AI Service Types
 * Defines interfaces and types for AI functionality
 */
// Error types
class AIServiceError extends Error {
    code;
    provider;
    originalError;
    constructor(message, code, provider, originalError) {
        super(message);
        this.code = code;
        this.provider = provider;
        this.originalError = originalError;
        this.name = 'AIServiceError';
    }
}
class AIProviderError extends AIServiceError {
    constructor(message, provider, originalError) {
        super(message, 'PROVIDER_ERROR', provider, originalError);
        this.name = 'AIProviderError';
    }
}
class AIRateLimitError extends AIServiceError {
    retryAfter;
    constructor(message, provider, retryAfter) {
        super(message, 'RATE_LIMIT', provider);
        this.retryAfter = retryAfter;
        this.name = 'AIRateLimitError';
    }
}
// Note: AIProviderConfig and AIUseCase are exported from config.js to avoid conflicts

/**
 * OpenRouter AI Provider
 * Implements the AIProvider interface for OpenRouter API
 */
class OpenRouterProvider {
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
                        catch (error) {
                            console.error('OpenRouterProvider: Failed to parse stream data chunk.', error);
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

/**
 * Cloudflare AI Provider
 * Implements the AIProvider interface for Cloudflare Workers AI
 */
class CloudflareAIProvider {
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

/**
 * AI Provider Factory
 * Creates AI providers based on configuration
 */
function createProvider(config) {
    switch (config.provider) {
        case 'openrouter':
            if (!config.apiKey) {
                throw new Error('OpenRouter provider requires an API key');
            }
            return new OpenRouterProvider({
                apiKey: config.apiKey,
                modelId: config.modelId,
                baseUrl: config.baseUrl,
                maxRetries: 3,
                timeout: 30000
            });
        case 'cloudflare':
            // For Cloudflare, we may not need credentials if running in Worker environment
            return new CloudflareAIProvider({
                modelId: config.modelId,
                accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
                apiToken: config.apiKey || process.env.CLOUDFLARE_API_TOKEN,
                baseUrl: config.baseUrl,
                maxRetries: 3,
                timeout: 30000
            });
        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
}

/**
 * Main AI Service
 * Provides a unified interface with fallback capabilities and retry logic
 */
class AIService {
    primaryProvider;
    fallbackProvider;
    retryAttempts;
    retryDelay;
    timeout;
    constructor(config) {
        this.primaryProvider = config.primaryProvider;
        this.fallbackProvider = config.fallbackProvider;
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000;
        this.timeout = config.timeout || 30000;
    }
    /**
     * Generate text using AI with automatic fallback and retry
     */
    async generateText(messages, options) {
        const providers = this.getProviderOrder();
        let lastError = null;
        for (const provider of providers) {
            try {
                // Check if provider is available
                const isAvailable = await this.withTimeout(provider.isAvailable(), 5000 // Quick availability check
                );
                if (!isAvailable) {
                    continue;
                }
                // Attempt generation with retry logic
                return await this.generateWithRetry(provider, messages, options);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Log provider failure
                console.warn(`AI Provider ${provider.name} failed:`, lastError.message);
                // Don't try fallback for certain errors
                if (error instanceof AIRateLimitError && error.retryAfter) {
                    // If we have a specific retry time, respect it
                    throw error;
                }
                // Continue to next provider for other errors
                continue;
            }
        }
        throw new AIServiceError(`All AI providers failed. Last error: ${lastError?.message}`, 'ALL_PROVIDERS_FAILED', undefined, lastError || undefined);
    }
    /**
     * Generate streaming text with fallback support
     */
    async *generateStream(messages, options) {
        const providers = this.getProviderOrder();
        let lastError = null;
        for (const provider of providers) {
            try {
                // Check if provider supports streaming
                if (!provider.generateStream) {
                    // Fall back to non-streaming for providers that don't support it
                    const response = await this.generateText(messages, options);
                    yield {
                        content: response.content,
                        done: true,
                        usage: response.usage
                    };
                    return;
                }
                // Check if provider is available
                const isAvailable = await this.withTimeout(provider.isAvailable(), 5000);
                if (!isAvailable) {
                    continue;
                }
                // Stream from this provider
                for await (const chunk of provider.generateStream(messages, options)) {
                    yield chunk;
                }
                return; // Successfully streamed
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`AI Provider ${provider.name} streaming failed:`, lastError.message);
                continue;
            }
        }
        throw new AIServiceError(`All AI providers failed for streaming. Last error: ${lastError?.message}`, 'ALL_PROVIDERS_FAILED', undefined, lastError || undefined);
    }
    /**
     * Get the health status of all providers
     */
    async getProvidersHealth() {
        const providers = this.getProviderOrder();
        const health = {};
        await Promise.allSettled(providers.map(async (provider) => {
            try {
                const available = await this.withTimeout(provider.isAvailable(), 5000);
                health[provider.name] = { available };
            }
            catch (error) {
                health[provider.name] = {
                    available: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        }));
        return health;
    }
    getProviderOrder() {
        const providers = [this.primaryProvider];
        if (this.fallbackProvider) {
            providers.push(this.fallbackProvider);
        }
        return providers;
    }
    async generateWithRetry(provider, messages, options) {
        let lastError = null;
        for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
            try {
                return await this.withTimeout(provider.generateText(messages, options), this.timeout);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Don't retry on certain errors
                if (error instanceof AIProviderError &&
                    (error.message.includes('Authentication') ||
                        error.message.includes('not found') ||
                        error.message.includes('invalid'))) {
                    throw error;
                }
                // Don't retry on rate limit errors - let the fallback handle it
                if (error instanceof AIRateLimitError) {
                    throw error;
                }
                // Wait before retry (exponential backoff)
                if (attempt < this.retryAttempts - 1) {
                    const delay = this.retryDelay * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw new AIProviderError(`Provider ${provider.name} failed after ${this.retryAttempts} attempts: ${lastError?.message}`, provider.name, lastError || undefined);
    }
    async withTimeout(promise, timeoutMs) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
        });
        return Promise.race([promise, timeoutPromise]);
    }
}
/**
 * Create an AI service from configuration
 */
function createAIService(config) {
    const finalConfig = { ...DEFAULT_AI_CONFIG, ...config };
    // Handle missing API keys by using available providers
    let primaryConfig = finalConfig.primary;
    let fallbackConfig = finalConfig.fallback;
    // If OpenRouter is configured but no API key is available, try Cloudflare
    if (primaryConfig.provider === 'openrouter' &&
        !primaryConfig.apiKey &&
        !getAPIKey('openrouter')) {
        // Fall back to Cloudflare for primary if OpenRouter key is missing
        primaryConfig = {
            provider: 'cloudflare',
            modelId: '@cf/google/gemma-2b-it',
            maxTokens: 2048,
            temperature: 0.1
        };
    }
    // Create providers with API keys from environment or config
    const primaryProvider = createProvider({
        ...primaryConfig,
        apiKey: primaryConfig.apiKey || getAPIKey(primaryConfig.provider)
    });
    let fallbackProvider;
    if (fallbackConfig) {
        // Skip fallback if it's the same as primary after auto-switching
        if (fallbackConfig.provider === 'openrouter' &&
            !fallbackConfig.apiKey &&
            !getAPIKey('openrouter') &&
            primaryConfig.provider === 'cloudflare') {
            // Don't create a fallback if we already switched to Cloudflare
            fallbackProvider = undefined;
        }
        else {
            try {
                fallbackProvider = createProvider({
                    ...fallbackConfig,
                    apiKey: fallbackConfig.apiKey || getAPIKey(fallbackConfig.provider)
                });
            }
            catch (error) {
                // If fallback provider fails to create, log warning and continue without it
                console.warn('Failed to create fallback provider:', error instanceof Error ? error.message : String(error));
            }
        }
    }
    return new AIService({
        primaryProvider,
        fallbackProvider,
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 30000
    });
}
/**
 * Get API key from environment variables
 */
function getAPIKey(provider) {
    // Check if we're in Node.js environment
    if (typeof process !== 'undefined' && process.env) {
        switch (provider) {
            case 'openrouter':
                return process.env.OPENROUTER_API_KEY;
            case 'cloudflare':
                return process.env.CLOUDFLARE_API_TOKEN;
            default:
                return undefined;
        }
    }
    return undefined;
}

/**
 * Financial AI Service
 * Specialized AI service for financial operations and analysis
 */
class FinancialAIService {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    /**
     * Analyze a financial transaction for accuracy and compliance
     */
    async analyzeTransaction(transaction) {
        const useCase = AI_USE_CASES.TRANSACTION_ANALYSIS;
        const messages = [
            {
                role: 'system',
                content: `You are a financial analyst specializing in transaction analysis. ${useCase.prompt}
        
Analyze the transaction for:
- Completeness and accuracy
- Compliance with double-entry accounting principles
- Potential errors or inconsistencies
- Missing information

Respond with a JSON object containing:
- analysis: Detailed analysis text
- confidence: Confidence score (0-1)
- suggestions: Array of improvement suggestions
- warnings: Array of potential issues`
            },
            {
                role: 'user',
                content: `Transaction to analyze:\n${JSON.stringify(transaction, null, 2)}`
            }
        ];
        const response = await this.aiService.generateText(messages, {
            maxTokens: useCase.maxTokens,
            temperature: useCase.temperature
        });
        try {
            const parsed = JSON.parse(response.content);
            return {
                analysis: parsed.analysis || response.content,
                confidence: parsed.confidence || 0.8,
                suggestions: parsed.suggestions || [],
                warnings: parsed.warnings || []
            };
        }
        catch {
            // Fallback if JSON parsing fails
            return {
                analysis: response.content,
                confidence: 0.7,
                suggestions: [],
                warnings: []
            };
        }
    }
    /**
     * Categorize expenses automatically
     */
    async categorizeExpense(description, amount, merchant, existingCategories) {
        const useCase = AI_USE_CASES.EXPENSE_CATEGORIZATION;
        const categoriesContext = existingCategories
            ? `Available categories: ${existingCategories.join(', ')}`
            : 'Use standard accounting expense categories';
        const messages = [
            {
                role: 'system',
                content: `You are an expert accountant specializing in expense categorization. ${useCase.prompt}
        
${categoriesContext}

Analyze the expense and provide:
- Primary category (e.g., "Office Supplies", "Travel", "Marketing")
- Optional subcategory for more specific classification
- Confidence level (0-1)

Respond with JSON: {"category": "...", "subcategory": "...", "confidence": 0.95}`
            },
            {
                role: 'user',
                content: `Expense Details:
Description: ${description}
Amount: ${amount}
${merchant ? `Merchant: ${merchant}` : ''}`
            }
        ];
        const response = await this.aiService.generateText(messages, {
            maxTokens: useCase.maxTokens,
            temperature: useCase.temperature
        });
        try {
            const parsed = JSON.parse(response.content);
            return {
                category: parsed.category,
                subcategory: parsed.subcategory,
                confidence: parsed.confidence || 0.8
            };
        }
        catch {
            // Fallback categorization
            return {
                category: 'General Expense',
                confidence: 0.5
            };
        }
    }
    /**
     * Generate financial insights and recommendations
     */
    async generateInsights(data) {
        const useCase = AI_USE_CASES.FINANCIAL_INSIGHTS;
        const messages = [
            {
                role: 'system',
                content: `You are a senior financial advisor with expertise in business financial analysis. ${useCase.prompt}
        
Provide insights on:
- Spending patterns and trends
- Cash flow analysis
- Cost optimization opportunities
- Financial health indicators
- Actionable recommendations

Format as JSON with analysis, confidence, suggestions, and warnings arrays.`
            },
            {
                role: 'user',
                content: `Financial Data Analysis Request:
${data.context ? `Context: ${data.context}\n` : ''}
${data.timeframe ? `Timeframe: ${data.timeframe}\n` : ''}

Data:
${JSON.stringify(data, null, 2)}`
            }
        ];
        const response = await this.aiService.generateText(messages, {
            maxTokens: useCase.maxTokens,
            temperature: useCase.temperature
        });
        try {
            const parsed = JSON.parse(response.content);
            return {
                analysis: parsed.analysis || response.content,
                confidence: parsed.confidence || 0.8,
                suggestions: parsed.suggestions || [],
                warnings: parsed.warnings || []
            };
        }
        catch {
            return {
                analysis: response.content,
                confidence: 0.7,
                suggestions: [],
                warnings: []
            };
        }
    }
    /**
     * Check financial data for compliance issues
     */
    async checkCompliance(data, regulations) {
        const useCase = AI_USE_CASES.COMPLIANCE_CHECK;
        const regulationsContext = regulations
            ? `Focus on these regulations: ${regulations.join(', ')}`
            : 'Check against standard financial regulations and accounting principles';
        const messages = [
            {
                role: 'system',
                content: `You are a compliance officer with expertise in financial regulations. ${useCase.prompt}
        
${regulationsContext}

Check for:
- Regulatory compliance issues
- Accounting standard violations
- Missing required documentation
- Potential audit flags
- Risk indicators

Provide detailed findings with specific recommendations.`
            },
            {
                role: 'user',
                content: `Compliance Check Request:
${JSON.stringify(data, null, 2)}`
            }
        ];
        const response = await this.aiService.generateText(messages, {
            maxTokens: useCase.maxTokens,
            temperature: useCase.temperature
        });
        try {
            const parsed = JSON.parse(response.content);
            return {
                analysis: parsed.analysis || response.content,
                confidence: parsed.confidence || 0.9,
                suggestions: parsed.suggestions || [],
                warnings: parsed.warnings || []
            };
        }
        catch {
            return {
                analysis: response.content,
                confidence: 0.8,
                suggestions: [],
                warnings: []
            };
        }
    }
    /**
     * Generate a financial report summary
     */
    async generateReportSummary(reportData, reportType) {
        const useCase = AI_USE_CASES.REPORT_GENERATION;
        const messages = [
            {
                role: 'system',
                content: `You are a financial analyst creating executive summaries. ${useCase.prompt}
        
Create a clear, concise summary for a ${reportType} that highlights:
- Key financial metrics and their implications
- Notable changes or trends
- Areas of concern or opportunity
- Executive-level insights

Write in professional, business-appropriate language.`
            },
            {
                role: 'user',
                content: `Generate summary for ${reportType}:
${JSON.stringify(reportData, null, 2)}`
            }
        ];
        const response = await this.aiService.generateText(messages, {
            maxTokens: useCase.maxTokens,
            temperature: useCase.temperature
        });
        return response.content;
    }
    /**
     * Extract structured data from financial documents
     */
    async extractDocumentData(ocrResult, documentType) {
        const messages = [
            {
                role: 'system',
                content: `You are an expert at extracting structured financial data from documents.
        
Extract relevant financial information from the OCR text and return it as structured JSON.

For receipts/invoices, extract:
- vendor/merchant name
- date
- total amount
- line items with descriptions and amounts
- tax information
- payment method

For bank statements, extract:
- account information
- transactions with dates, descriptions, amounts
- running balance
- fee information

Return clean, structured JSON that can be used to create accounting entries.`
            },
            {
                role: 'user',
                content: `Document Type: ${documentType || 'unknown'}
OCR Confidence: ${ocrResult.confidence}
Text Content:
${ocrResult.text}`
            }
        ];
        const response = await this.aiService.generateText(messages, {
            maxTokens: 3072,
            temperature: 0.1
        });
        try {
            return JSON.parse(response.content);
        }
        catch {
            // Return raw analysis if JSON parsing fails
            return {
                raw_analysis: response.content,
                confidence: ocrResult.confidence
            };
        }
    }
    /**
     * Classify financial documents
     */
    async classifyDocument(ocrResult) {
        const messages = [
            {
                role: 'system',
                content: `You are an expert at classifying financial documents.
        
Analyze the OCR text and classify the document type. Return JSON with:
- type: 'receipt', 'invoice', 'bank_statement', 'tax_document', or 'other'
- confidence: confidence level (0-1)
- subtype: more specific classification if applicable
- extractedFields: key fields that indicate the document type

Base your classification on document structure, headers, formatting patterns, and key phrases typically found in each document type.`
            },
            {
                role: 'user',
                content: `OCR Text (confidence: ${ocrResult.confidence}):
${ocrResult.text}`
            }
        ];
        const response = await this.aiService.generateText(messages, {
            maxTokens: 1024,
            temperature: 0.1
        });
        try {
            const parsed = JSON.parse(response.content);
            return {
                type: parsed.type || 'other',
                confidence: parsed.confidence || 0.5,
                subtype: parsed.subtype,
                extractedFields: parsed.extractedFields || {}
            };
        }
        catch {
            // Fallback classification
            return {
                type: 'other',
                confidence: 0.3
            };
        }
    }
    /**
     * Generate transaction entries from natural language description
     */
    async generateTransactionEntries(description, amount, availableAccounts) {
        const accountsContext = availableAccounts
            .map(acc => `${acc.code}: ${acc.name} (${acc.type})`)
            .join('\n');
        const messages = [
            {
                role: 'system',
                content: `You are an expert accountant who creates double-entry transaction entries.
        
Based on the description and amount, create appropriate transaction entries using the available accounts.

Available Accounts:
${accountsContext}

Rules:
- Debits must equal credits
- Use appropriate accounts based on the transaction type
- Follow standard accounting principles
- Return JSON array of entries with accountId, description, debitAmount, creditAmount

Format: [{"accountId": 123, "description": "...", "debitAmount": 100, "creditAmount": 0}, ...]`
            },
            {
                role: 'user',
                content: `Transaction Description: ${description}
Amount: ${amount}

Generate the appropriate journal entries.`
            }
        ];
        const response = await this.aiService.generateText(messages, {
            maxTokens: 2048,
            temperature: 0.1
        });
        try {
            const entries = JSON.parse(response.content);
            return Array.isArray(entries) ? entries : [];
        }
        catch {
            // Fallback - return basic entries if parsing fails
            return [];
        }
    }
    /**
     * Get the health status of the underlying AI service
     */
    async getHealthStatus() {
        return this.aiService.getProvidersHealth();
    }
}

const prerender = false;
const POST = async ({ request }) => {
  try {
    const { type, data } = await request.json();
    const aiService = createAIService();
    const financialAI = new FinancialAIService(aiService);
    let result;
    switch (type) {
      case "transaction-analysis":
        result = await financialAI.analyzeTransaction(data);
        break;
      case "categorize-expense":
        result = await financialAI.categorizeExpense(data.description, data.amount);
        break;
      case "generate-insights":
        result = await financialAI.generateInsights({
          transactions: data.transactions,
          accounts: data.accounts,
          timeframe: data.timeframe,
          context: data.context
        });
        break;
      case "analyze-document":
        result = { error: "Document analysis not yet implemented" };
        break;
      case "fraud-detection":
        result = { error: "Fraud detection not yet implemented" };
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid analysis type" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
    return new Response(
      JSON.stringify({ success: true, result }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      }
    );
  } catch (error) {
    console.error("AI Analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
};
const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    OPTIONS,
    POST,
    prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
