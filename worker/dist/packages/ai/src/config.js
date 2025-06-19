/**
 * AI Model Configuration for Finance Manager
 * Supports OpenRouter and Cloudflare AI providers
 */
// Default AI model configuration matching user preferences
export const DEFAULT_AI_CONFIG = {
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
// Cloudflare AI alternative models
export const CLOUDFLARE_AI_CONFIG = {
    primary: {
        provider: 'cloudflare',
        modelId: '@cf/google/gemma-2b-it', // Cloudflare's fast model
        maxTokens: 2048,
        temperature: 0.1,
    },
    fallback: {
        provider: 'cloudflare',
        modelId: '@cf/meta/llama-2-7b-chat-int8',
        maxTokens: 2048,
        temperature: 0.1,
    }
};
// Model capabilities for different use cases
export const AI_USE_CASES = {
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
