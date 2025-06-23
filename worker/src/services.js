import { FinancialAIService, AIService, createVectorizeService, OpenRouterProvider } from '@finance-manager/ai';
export function createFinancialAIService(env) {
    try {
        if (!env.OPENROUTER_API_KEY) {
            return null;
        }
        const provider = new OpenRouterProvider({
            apiKey: env.OPENROUTER_API_KEY,
            baseUrl: 'https://openrouter.ai/api/v1',
            modelId: 'anthropic/claude-3.5-sonnet'
        });
        const aiService = new AIService({
            primaryProvider: provider
        });
        return new FinancialAIService(aiService);
    }
    catch (error) {
        console.error('Failed to create FinancialAIService:', error);
        return null;
    }
}
export function createVectorizeServiceInstance(env, deps) {
    const { DOCUMENT_EMBEDDINGS: envVectorize, AI: envAi } = env;
    const ai = deps?.ai || envAi;
    const vectorize = deps?.vectorize || envVectorize;
    return createVectorizeService({
        vectorize,
        ai,
        embeddingModel: '@cf/baai/bge-base-en-v1.5',
        maxTextLength: 8000,
        chunkSize: 1000,
        chunkOverlap: 200
    });
}
