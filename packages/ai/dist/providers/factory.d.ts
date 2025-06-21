/**
 * AI Provider Factory
 * Creates AI providers based on configuration
 */
import type { AIProvider } from '../types.js';
import type { AIModelConfig } from '../config.js';
export declare function createProvider(config: AIModelConfig): AIProvider;
export declare function createProviderFromEnv(provider: 'openrouter' | 'cloudflare', modelId: string): AIProvider;
//# sourceMappingURL=factory.d.ts.map