/**
 * Main AI Service
 * Provides a unified interface with fallback capabilities and retry logic
 */

import type { 
  AIProvider, 
  AIMessage, 
  AIResponse, 
  AIStreamResponse, 
  AIGenerationOptions,
  AIServiceConfig
} from '../types.js';
import {
  AIServiceError,
  AIProviderError,
  AIRateLimitError,
  AITimeoutError
} from '../types.js';
import { createProvider } from '../providers/factory.js';
import { DEFAULT_AI_CONFIG, type AIProviderConfig } from '../config.js';

export class AIService {
  private primaryProvider: AIProvider;
  private fallbackProvider?: AIProvider;
  private retryAttempts: number;
  private retryDelay: number;
  private timeout: number;

  constructor(config: AIServiceConfig) {
    this.primaryProvider = config.primaryProvider;
    this.fallbackProvider = config.fallbackProvider;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Generate text using AI with automatic fallback and retry
   */
  async generateText(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse> {
    const providers = this.getProviderOrder();
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        // Check if provider is available
        const isAvailable = await this.withTimeout(
          provider.isAvailable(),
          5000 // Quick availability check
        );

        if (!isAvailable) {
          continue;
        }

        // Attempt generation with retry logic
        return await this.generateWithRetry(provider, messages, options);

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log provider failure
        console.warn(`AI Provider ${provider.name} failed:`, lastError.message);
        
        // Rethrow specific, non-retriable errors to prevent fallback
        if (error instanceof AIProviderError || error instanceof AIRateLimitError || error instanceof AITimeoutError) {
          throw error;
        }

        // Continue to next provider for other errors
        continue;
      }
    }

    throw new AIServiceError(
      `All AI providers failed. Last error: ${lastError?.message}`,
      'ALL_PROVIDERS_FAILED',
      undefined,
      lastError || undefined
    );
  }

  /**
   * Generate streaming text with fallback support
   */
  async *generateStream(messages: AIMessage[], options?: AIGenerationOptions): AsyncGenerator<AIStreamResponse> {
    const providers = this.getProviderOrder();
    let lastError: Error | null = null;

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

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`AI Provider ${provider.name} streaming failed:`, lastError.message);
        continue;
      }
    }

    throw new AIServiceError(
      `All AI providers failed for streaming. Last error: ${lastError?.message}`,
      'ALL_PROVIDERS_FAILED',
      undefined,
      lastError || undefined
    );
  }

  /**
   * Get the health status of all providers
   */
  async getProvidersHealth(): Promise<Record<string, { available: boolean; error?: string }>> {
    const providers = this.getProviderOrder();
    const health: Record<string, { available: boolean; error?: string }> = {};

    await Promise.allSettled(
      providers.map(async (provider) => {
        try {
          const available = await this.withTimeout(provider.isAvailable(), 5000);
          health[provider.name] = { available };
        } catch (error) {
          health[provider.name] = {
            available: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    );

    return health;
  }

  private getProviderOrder(): AIProvider[] {
    const providers = [this.primaryProvider];
    if (this.fallbackProvider) {
      providers.push(this.fallbackProvider);
    }
    return providers;
  }

  private async generateWithRetry(
    provider: AIProvider,
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        return await this.withTimeout(
          provider.generateText(messages, options),
          this.timeout
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain errors
        if (error instanceof AIProviderError && 
            (error.message.includes('Authentication') || 
             error.message.includes('not found') ||
             error.message.includes('invalid'))) {
          throw error;
        }

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

    throw lastError;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new AITimeoutError(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }
}

/**
 * Create an AI service from configuration
 */
export function createAIService(config?: Partial<AIProviderConfig>): AIService {
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

  let fallbackProvider: AIProvider | undefined;
  if (fallbackConfig) {
    // Skip fallback if it's the same as primary after auto-switching
    if (fallbackConfig.provider === 'openrouter' && 
        !fallbackConfig.apiKey && 
        !getAPIKey('openrouter') &&
        primaryConfig.provider === 'cloudflare') {
      // Don't create a fallback if we already switched to Cloudflare
      fallbackProvider = undefined;
    } else {
      try {
        fallbackProvider = createProvider({
          ...fallbackConfig,
          apiKey: fallbackConfig.apiKey || getAPIKey(fallbackConfig.provider)
        });
      } catch (error) {
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
function getAPIKey(provider: 'openrouter' | 'cloudflare'): string | undefined {
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