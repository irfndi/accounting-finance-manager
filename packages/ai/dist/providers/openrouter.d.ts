/**
 * OpenRouter AI Provider
 * Implements the AIProvider interface for OpenRouter API
 */
import type { AIProvider, AIMessage, AIResponse, AIStreamResponse, AIGenerationOptions } from '../types.js';
export interface OpenRouterConfig {
    apiKey: string;
    baseUrl?: string;
    modelId: string;
    maxRetries?: number;
    timeout?: number;
}
export declare class OpenRouterProvider implements AIProvider {
    readonly name = "openrouter";
    private readonly apiKey;
    private readonly baseUrl;
    private readonly modelId;
    private readonly maxRetries;
    private readonly timeout;
    constructor(config: OpenRouterConfig);
    generateText(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse>;
    generateStream(messages: AIMessage[], options?: AIGenerationOptions): AsyncGenerator<AIStreamResponse>;
    isAvailable(): Promise<boolean>;
    private makeRequest;
    private parseResponse;
}
//# sourceMappingURL=openrouter.d.ts.map