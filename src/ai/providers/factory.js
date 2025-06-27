/**
 * AI Provider Factory
 * Creates AI providers based on configuration
 */
import { OpenRouterProvider } from './openrouter.js';
import { CloudflareAIProvider } from './cloudflare.js';
export function createProvider(config) {
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
export function createProviderFromEnv(provider, modelId) {
    switch (provider) {
        case 'openrouter':
            const openRouterKey = process.env.OPENROUTER_API_KEY;
            if (!openRouterKey) {
                throw new Error('OPENROUTER_API_KEY environment variable is required');
            }
            return new OpenRouterProvider({
                apiKey: openRouterKey,
                modelId,
                baseUrl: process.env.OPENROUTER_BASE_URL
            });
        case 'cloudflare':
            return new CloudflareAIProvider({
                modelId,
                accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
                apiToken: process.env.CLOUDFLARE_API_TOKEN,
                baseUrl: process.env.CLOUDFLARE_BASE_URL
            });
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
}
