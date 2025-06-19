/**
 * AI Model Configuration for Finance Manager
 * Supports OpenRouter and Cloudflare AI providers
 */
export interface AIModelConfig {
    provider: 'openrouter' | 'cloudflare';
    modelId: string;
    apiKey?: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
}
export interface AIProviderConfig {
    primary: AIModelConfig;
    fallback: AIModelConfig;
    research?: AIModelConfig;
}
export declare const DEFAULT_AI_CONFIG: AIProviderConfig;
export declare const CLOUDFLARE_AI_CONFIG: AIProviderConfig;
export declare const AI_USE_CASES: {
    readonly TRANSACTION_ANALYSIS: {
        readonly prompt: "Analyze this financial transaction for accuracy and compliance:";
        readonly maxTokens: 2048;
        readonly temperature: 0.05;
    };
    readonly EXPENSE_CATEGORIZATION: {
        readonly prompt: "Categorize this expense according to standard accounting principles:";
        readonly maxTokens: 1024;
        readonly temperature: 0.1;
    };
    readonly FINANCIAL_INSIGHTS: {
        readonly prompt: "Provide financial insights and recommendations based on this data:";
        readonly maxTokens: 4096;
        readonly temperature: 0.3;
    };
    readonly REPORT_GENERATION: {
        readonly prompt: "Generate a financial report summary:";
        readonly maxTokens: 3072;
        readonly temperature: 0.2;
    };
    readonly COMPLIANCE_CHECK: {
        readonly prompt: "Check this financial data for compliance and potential issues:";
        readonly maxTokens: 2048;
        readonly temperature: 0.05;
    };
};
export type AIUseCase = keyof typeof AI_USE_CASES;
//# sourceMappingURL=config.d.ts.map