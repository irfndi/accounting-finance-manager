/**
 * AI Service Types
 * Defines interfaces and types for AI functionality
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  model?: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls';
}

export interface AIStreamResponse {
  content: string;
  delta?: string;
  done: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIProvider {
  name: string;
  generateText(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse>;
  generateStream?(messages: AIMessage[], options?: AIGenerationOptions): AsyncGenerator<AIStreamResponse>;
  isAvailable(): Promise<boolean>;
}

export interface AIGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stop?: string[];
  stream?: boolean;
}

export interface AIServiceConfig {
  primaryProvider: AIProvider;
  fallbackProvider?: AIProvider;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

// Finance-specific AI types
export interface FinancialAnalysisRequest {
  type: 'transaction' | 'expense' | 'report' | 'compliance';
  data: any;
  context?: string;
  language?: string;
}

export interface FinancialAnalysisResponse {
  analysis: string;
  confidence: number;
  suggestions?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>;
  language?: string;
}

export interface DocumentClassification {
  type: 'receipt' | 'invoice' | 'bank_statement' | 'tax_document' | 'other';
  confidence: number;
  subtype?: string;
  extractedFields?: Record<string, any>;
}

// Error types
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class AIProviderError extends AIServiceError {
  constructor(
    message: string,
    provider: string,
    originalError?: Error
  ) {
    super(message, 'PROVIDER_ERROR', provider, originalError);
    this.name = 'AIProviderError';
  }
}

export class AIRateLimitError extends AIServiceError {
  constructor(
    message: string,
    provider: string,
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT', provider);
    this.name = 'AIRateLimitError';
  }
}

export class AIQuotaExceededError extends AIServiceError {
  constructor(
    message: string,
    provider: string
  ) {
    super(message, 'QUOTA_EXCEEDED', provider);
    this.name = 'AIQuotaExceededError';
  }
}

// Note: AIProviderConfig and AIUseCase are exported from config.js to avoid conflicts 