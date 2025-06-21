/**
 * Main AI Service
 * Provides a unified interface with fallback capabilities and retry logic
 */
import type { AIMessage, AIResponse, AIStreamResponse, AIGenerationOptions, AIServiceConfig } from '../types.js';
import { type AIProviderConfig } from '../config.js';
export declare class AIService {
    private primaryProvider;
    private fallbackProvider?;
    private retryAttempts;
    private retryDelay;
    private timeout;
    constructor(config: AIServiceConfig);
    /**
     * Generate text using AI with automatic fallback and retry
     */
    generateText(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse>;
    /**
     * Generate streaming text with fallback support
     */
    generateStream(messages: AIMessage[], options?: AIGenerationOptions): AsyncGenerator<AIStreamResponse>;
    /**
     * Get the health status of all providers
     */
    getProvidersHealth(): Promise<Record<string, {
        available: boolean;
        error?: string;
    }>>;
    private getProviderOrder;
    private generateWithRetry;
    private withTimeout;
}
/**
 * Create an AI service from configuration
 */
export declare function createAIService(config?: Partial<AIProviderConfig>): AIService;
//# sourceMappingURL=ai-service.d.ts.map