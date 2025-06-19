/**
 * AI Service Types
 * Defines interfaces and types for AI functionality
 */
// Error types
export class AIServiceError extends Error {
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
export class AIProviderError extends AIServiceError {
    constructor(message, provider, originalError) {
        super(message, 'PROVIDER_ERROR', provider, originalError);
        this.name = 'AIProviderError';
    }
}
export class AIRateLimitError extends AIServiceError {
    retryAfter;
    constructor(message, provider, retryAfter) {
        super(message, 'RATE_LIMIT', provider);
        this.retryAfter = retryAfter;
        this.name = 'AIRateLimitError';
    }
}
export class AIQuotaExceededError extends AIServiceError {
    constructor(message, provider) {
        super(message, 'QUOTA_EXCEEDED', provider);
        this.name = 'AIQuotaExceededError';
    }
}
// Note: AIProviderConfig and AIUseCase are exported from config.js to avoid conflicts 
