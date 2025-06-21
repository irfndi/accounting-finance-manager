/**
 * Cloudflare AI Provider
 * Implements the AIProvider interface for Cloudflare Workers AI
 */
import type { AIProvider, AIMessage, AIResponse, AIStreamResponse, AIGenerationOptions } from '../types.js';
declare global {
    var AI: {
        run: (model: string, options: any) => Promise<any>;
    } | undefined;
}
export interface CloudflareAIConfig {
    accountId?: string;
    apiToken?: string;
    modelId: string;
    baseUrl?: string;
    maxRetries?: number;
    timeout?: number;
}
export declare class CloudflareAIProvider implements AIProvider {
    readonly name = "cloudflare";
    private readonly accountId?;
    private readonly apiToken?;
    private readonly modelId;
    private readonly baseUrl;
    private readonly maxRetries;
    private readonly timeout;
    constructor(config: CloudflareAIConfig);
    generateText(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse>;
    generateStream(messages: AIMessage[], options?: AIGenerationOptions): AsyncGenerator<AIStreamResponse>;
    isAvailable(): Promise<boolean>;
    private makeRequest;
    private makeWorkerRequest;
    private makeExternalRequest;
    private formatMessages;
    private parseResponse;
}
//# sourceMappingURL=cloudflare.d.ts.map