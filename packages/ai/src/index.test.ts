/**
 * Finance Manager AI Package Tests
 * Comprehensive tests for AI functionality including providers and services
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService, createAIService } from './services/ai-service.js';
import { FinancialAIService } from './services/financial-ai.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { CloudflareAIProvider } from './providers/cloudflare.js';
import { createProvider } from './providers/factory.js';
import type { AIMessage } from './types.js';
import { AIProviderError, AIRateLimitError } from './types.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('AI Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider Factory', () => {
    it('should create OpenRouter provider with valid config', () => {
      const provider = createProvider({
        provider: 'openrouter',
        modelId: 'gpt-4',
        apiKey: 'test-key'
      });

      expect(provider).toBeInstanceOf(OpenRouterProvider);
      expect(provider.name).toBe('openrouter');
    });

    it('should create Cloudflare provider with valid config', () => {
      const provider = createProvider({
        provider: 'cloudflare',
        modelId: '@cf/meta/llama-2-7b-chat-int8'
      });

      expect(provider).toBeInstanceOf(CloudflareAIProvider);
      expect(provider.name).toBe('cloudflare');
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        createProvider({
          provider: 'unsupported' as any,
          modelId: 'test'
        });
      }).toThrow('Unsupported AI provider: unsupported');
    });
  });

  describe('OpenRouter Provider', () => {
    let provider: OpenRouterProvider;

    beforeEach(() => {
      provider = new OpenRouterProvider({
        apiKey: 'test-key',
        modelId: 'gpt-4'
      });
    });

    it('should generate text successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: 'Test response' },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test message' }
      ];

      const response = await provider.generateText(messages);

      expect(response.content).toBe('Test response');
      expect(response.usage?.totalTokens).toBe(15);
      expect(response.finishReason).toBe('stop');
    });

    it('should handle rate limit errors', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        headers: new Map([['retry-after', '60']]),
        text: async () => 'Rate limit exceeded'
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test message' }
      ];

      await expect(provider.generateText(messages)).rejects.toThrow(AIRateLimitError);
    });

    it('should handle authentication errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test message' }
      ];

      await expect(provider.generateText(messages)).rejects.toThrow(AIProviderError);
    });

    it('should check availability correctly', async () => {
      const mockResponse = { ok: true };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(true);
    });
  });

  describe('Cloudflare Provider', () => {
    let provider: CloudflareAIProvider;

    beforeEach(() => {
      provider = new CloudflareAIProvider({
        modelId: '@cf/meta/llama-2-7b-chat-int8',
        accountId: 'test-account',
        apiToken: 'test-token'
      });
    });

    it('should generate text successfully with external API', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          result: { response: 'Cloudflare response' }
        })
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test message' }
      ];

      const response = await provider.generateText(messages);

      expect(response.content).toBe('Cloudflare response');
      expect(response.model).toBe('@cf/meta/llama-2-7b-chat-int8');
    });

    it('should detect Worker environment availability', async () => {
      // Mock Worker environment
      (globalThis as any).AI = {};
      
      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(true);

      // Cleanup
      delete (globalThis as any).AI;
    });

    it('should format messages correctly', async () => {
      const messages: AIMessage[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];

      // We need to access the private method for testing
      const formattedPrompt = (provider as any).formatMessages(messages);
      
      expect(formattedPrompt).toContain('System: You are a helpful assistant');
      expect(formattedPrompt).toContain('Human: Hello');
      expect(formattedPrompt).toContain('Assistant: Hi there!');
    });
  });

  describe('AI Service', () => {
    let primaryProvider: any;
    let fallbackProvider: any;
    let aiService: AIService;

    beforeEach(() => {
      primaryProvider = {
        name: 'primary',
        generateText: vi.fn(),
        isAvailable: vi.fn()
      };

      fallbackProvider = {
        name: 'fallback',
        generateText: vi.fn(),
        isAvailable: vi.fn()
      };

      aiService = new AIService({
        primaryProvider,
        fallbackProvider,
        retryAttempts: 2,
        retryDelay: 100
      });
    });

    it('should use primary provider when available', async () => {
      primaryProvider.isAvailable.mockResolvedValue(true);
      primaryProvider.generateText.mockResolvedValue({
        content: 'Primary response',
        usage: { totalTokens: 10 }
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const response = await aiService.generateText(messages);

      expect(response.content).toBe('Primary response');
      expect(primaryProvider.generateText).toHaveBeenCalledWith(messages, undefined);
      expect(fallbackProvider.generateText).not.toHaveBeenCalled();
    });

    it('should fallback to secondary provider when primary fails', async () => {
      primaryProvider.isAvailable.mockResolvedValue(true);
      primaryProvider.generateText.mockRejectedValue(new Error('Primary failed'));
      
      fallbackProvider.isAvailable.mockResolvedValue(true);
      fallbackProvider.generateText.mockResolvedValue({
        content: 'Fallback response',
        usage: { totalTokens: 15 }
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const response = await aiService.generateText(messages);

      expect(response.content).toBe('Fallback response');
      expect(primaryProvider.generateText).toHaveBeenCalled();
      expect(fallbackProvider.generateText).toHaveBeenCalled();
    });

    it('should throw error when all providers fail', async () => {
      primaryProvider.isAvailable.mockResolvedValue(true);
      primaryProvider.generateText.mockRejectedValue(new Error('Primary failed'));
      
      fallbackProvider.isAvailable.mockResolvedValue(true);
      fallbackProvider.generateText.mockRejectedValue(new Error('Fallback failed'));

      const messages: AIMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      await expect(aiService.generateText(messages)).rejects.toThrow('All AI providers failed');
    });

    it('should get providers health status', async () => {
      primaryProvider.isAvailable.mockResolvedValue(true);
      fallbackProvider.isAvailable.mockResolvedValue(false);

      const health = await aiService.getProvidersHealth();

      expect(health.primary.available).toBe(true);
      expect(health.fallback.available).toBe(false);
    });
  });

  describe('Financial AI Service', () => {
    let mockAIService: any;
    let financialAI: FinancialAIService;

    beforeEach(() => {
      mockAIService = {
        generateText: vi.fn(),
        getProvidersHealth: vi.fn()
      };

      financialAI = new FinancialAIService(mockAIService);
    });

    it('should analyze transactions', async () => {
      const mockAnalysis = {
        analysis: 'Transaction looks good',
        confidence: 0.9,
        suggestions: ['Add receipt'],
        warnings: []
      };

      mockAIService.generateText.mockResolvedValue({
        content: JSON.stringify(mockAnalysis)
      });

      const transaction = {
        id: '1',
        date: '2024-01-01',
        description: 'Office supplies',
        entries: []
      };

      const result = await financialAI.analyzeTransaction(transaction as any);

      expect(result.analysis).toBe('Transaction looks good');
      expect(result.confidence).toBe(0.9);
      expect(result.suggestions).toContain('Add receipt');
    });

    it('should categorize expenses', async () => {
      const mockCategory = {
        category: 'Office Supplies',
        subcategory: 'Stationery',
        confidence: 0.95
      };

      mockAIService.generateText.mockResolvedValue({
        content: JSON.stringify(mockCategory)
      });

      const result = await financialAI.categorizeExpense(
        'Pens and paper from Staples',
        25.99,
        'Staples'
      );

      expect(result.category).toBe('Office Supplies');
      expect(result.subcategory).toBe('Stationery');
      expect(result.confidence).toBe(0.95);
    });

    it('should handle malformed AI responses gracefully', async () => {
      mockAIService.generateText.mockResolvedValue({
        content: 'Invalid JSON response'
      });

      const transaction = {
        id: '1',
        date: '2024-01-01',
        description: 'Test transaction',
        entries: []
      };

      const result = await financialAI.analyzeTransaction(transaction as any);

      expect(result.analysis).toBe('Invalid JSON response');
      expect(result.confidence).toBe(0.7);
      expect(result.suggestions).toEqual([]);
    });

    it('should generate financial insights', async () => {
      const mockInsights = {
        analysis: 'Strong cash flow, consider investing surplus',
        confidence: 0.85,
        suggestions: ['Invest in short-term securities'],
        warnings: ['High marketing spend this quarter']
      };

      mockAIService.generateText.mockResolvedValue({
        content: JSON.stringify(mockInsights)
      });

      const data = {
        transactions: [],
        timeframe: 'Q1 2024',
        context: 'Small business analysis'
      };

      const result = await financialAI.generateInsights(data);

      expect(result.analysis).toBe('Strong cash flow, consider investing surplus');
      expect(result.suggestions).toContain('Invest in short-term securities');
      expect(result.warnings).toContain('High marketing spend this quarter');
    });

    it('should classify documents', async () => {
      const mockClassification = {
        type: 'receipt',
        confidence: 0.9,
        subtype: 'retail_purchase',
        extractedFields: { merchant: 'Target', amount: 45.67 }
      };

      mockAIService.generateText.mockResolvedValue({
        content: JSON.stringify(mockClassification)
      });

      const ocrResult = {
        text: 'TARGET Store #1234\nDATE: 01/15/2024\nTOTAL: $45.67',
        confidence: 0.95
      };

      const result = await financialAI.classifyDocument(ocrResult);

      expect(result.type).toBe('receipt');
      expect(result.subtype).toBe('retail_purchase');
      expect(result.extractedFields?.merchant).toBe('Target');
    });

    it('should generate transaction entries', async () => {
      const mockEntries = [
        { accountId: 1001, description: 'Office supplies expense', debitAmount: 100, creditAmount: 0 },
        { accountId: 2001, description: 'Cash payment', debitAmount: 0, creditAmount: 100 }
      ];

      mockAIService.generateText.mockResolvedValue({
        content: JSON.stringify(mockEntries)
      });

      const accounts = [
        { id: 1001, code: '6001', name: 'Office Supplies', type: 'EXPENSE' },
        { id: 2001, code: '1001', name: 'Cash', type: 'ASSET' }
      ] as any[];

      const result = await financialAI.generateTransactionEntries(
        'Purchased office supplies with cash',
        100,
        accounts
      );

      expect(result).toHaveLength(2);
      expect(result[0].accountId).toBe(1001);
      expect(result[0].debitAmount).toBe(100);
      expect(result[1].creditAmount).toBe(100);
    });
  });

  describe('AI Service Factory', () => {
    it('should create AI service with default configuration', () => {
      // Mock environment variables
      process.env.OPENROUTER_API_KEY = 'test-key';
      
      const service = createAIService();
      
      expect(service).toBeInstanceOf(AIService);
      
      // Cleanup
      delete process.env.OPENROUTER_API_KEY;
    });

    it('should create AI service with custom configuration', () => {
      const customConfig = {
        primary: {
          provider: 'cloudflare' as const,
          modelId: '@cf/meta/llama-2-7b-chat-int8'
        }
      };

      const service = createAIService(customConfig);
      
      expect(service).toBeInstanceOf(AIService);
    });

    it('should create AI service with OpenRouter and API key', () => {
      const customConfig = {
        primary: {
          provider: 'openrouter' as const,
          modelId: 'gpt-4',
          apiKey: 'test-api-key'
        }
      };

      const service = createAIService(customConfig);
      
      expect(service).toBeInstanceOf(AIService);
    });
  });
}); 