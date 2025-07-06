/// <reference types="vitest" />

/**
 * Tests for AI Service
 * Comprehensive test coverage for the main AI service with fallback and retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach, type TestFunction, type Mock } from 'vitest';
import { AIService, createAIService } from '../../src/ai/services/ai-service.js';
import type { AIProvider, AIMessage, AIResponse, AIStreamResponse, AIServiceConfig } from '../../src/ai/types.js';
import { AIServiceError, AIProviderError, AIRateLimitError } from '../../src/ai/types.js';
import { createProvider } from '../../src/ai/providers/factory.js';

// Mock the provider factory
vi.mock('../../src/ai/providers/factory.js', () => ({
  createProvider: vi.fn()
}));

// Mock the config and getAPIKey function
vi.mock('../../src/ai/config.js', async (importOriginal) => {
  const original = await importOriginal() as any;
  return {
    ...original,
    getAPIKey: vi.fn((provider: string) => `${provider}-key`)
  };
});

describe('AIService', () => {
  let mockPrimaryProvider: AIProvider;
  let mockFallbackProvider: AIProvider;
  let aiService: AIService;
  let config: AIServiceConfig;

  const mockMessages: AIMessage[] = [
    { role: 'user', content: 'Test message' }
  ];

  const mockResponse: AIResponse = {
    content: 'Test response',
    usage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30
    }
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock providers
    mockPrimaryProvider = {
      name: 'primary-provider',
      isAvailable: vi.fn().mockResolvedValue(true),
      generateText: vi.fn().mockResolvedValue(mockResponse),
      generateStream: vi.fn()
    };

    mockFallbackProvider = {
      name: 'fallback-provider',
      isAvailable: vi.fn().mockResolvedValue(true),
      generateText: vi.fn().mockResolvedValue(mockResponse),
      generateStream: vi.fn()
    };

    // Set up the createProvider mock to return the correct provider
    (createProvider as Mock).mockImplementation((config: any) => {
      if (config.provider === 'cloudflare') {
        return mockFallbackProvider;
      }
      return mockPrimaryProvider;
    });

    config = {
      primaryProvider: mockPrimaryProvider,
      fallbackProvider: mockFallbackProvider,
      retryAttempts: 3,
      retryDelay: 100, // Shorter delay for tests
      timeout: 5000
    };

    aiService = new AIService(config);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateText', () => {
    it('should return response from primary provider on success', async () => {
      const result = await aiService.generateText(mockMessages);
      expect(result).toEqual(mockResponse);
      expect(mockPrimaryProvider.generateText).toHaveBeenCalledTimes(1);
      expect(mockFallbackProvider.generateText).not.toHaveBeenCalled();
    });

    it('should fallback to secondary provider when primary fails', async () => {
      // Setup primary provider to fail
      vi.mocked(mockPrimaryProvider.generateText).mockRejectedValue(new Error('Primary failed'));

      const result = await aiService.generateText(mockMessages);
      expect(result).toEqual(mockResponse);

      // Verify primary was called, and fallback was called
      expect(mockPrimaryProvider.generateText).toHaveBeenCalledTimes(3); // Default retries
      expect(mockFallbackProvider.generateText).toHaveBeenCalledTimes(1);
    });

    it('should throw AIServiceError when all providers fail', async () => {
      // Setup both providers to fail
      vi.mocked(mockPrimaryProvider.generateText).mockRejectedValue(new Error('Primary failed'));
      vi.mocked(mockFallbackProvider.generateText).mockRejectedValue(new Error('Fallback failed'));

      await expect(aiService.generateText(mockMessages)).rejects.toThrow(AIServiceError);
      await expect(aiService.generateText(mockMessages)).rejects.toThrow('All AI providers failed');
    });

    it('should not retry on authentication errors', async () => {
      const authError = new AIProviderError('Authentication failed', 'primary-provider');
      vi.mocked(mockPrimaryProvider.generateText).mockRejectedValue(authError);

      await expect(aiService.generateText(mockMessages)).rejects.toThrow(authError);
      expect(mockPrimaryProvider.generateText).toHaveBeenCalledTimes(1);
    });

    it('should not retry on rate limit errors', async () => {
      const rateLimitError = new AIRateLimitError('Rate limited', 'test-provider', 60);
      vi.mocked(mockPrimaryProvider.generateText).mockRejectedValue(rateLimitError);

      await expect(aiService.generateText(mockMessages)).rejects.toThrow(rateLimitError);
      expect(mockPrimaryProvider.generateText).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout correctly', async () => {
      // Create a service with very short timeout
      const shortTimeoutService = new AIService({
        ...config,
        timeout: 10 // 10ms timeout
      });

      vi.mocked(mockPrimaryProvider.generateText).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
      );

      await expect(shortTimeoutService.generateText(mockMessages)).rejects.toThrow('Operation timed out');
    });

    it('should pass options to provider', async () => {
      const options = { temperature: 0.5, maxTokens: 1000 };
      
      await aiService.generateText(mockMessages, options);

      expect(mockPrimaryProvider.generateText).toHaveBeenCalledWith(mockMessages, options);
    });
  });

  describe('generateStream', () => {
    const mockStreamChunk: AIStreamResponse = {
      content: 'chunk',
      done: false
    };

    const mockFinalChunk: AIStreamResponse = {
      content: 'final',
      done: true,
      usage: mockResponse.usage
    };

    it('should stream from primary provider when available', async () => {
      vi.mocked(mockPrimaryProvider.generateStream!).mockImplementation(async function* () {
        yield mockStreamChunk;
        yield mockFinalChunk;
      });

      const chunks: AIStreamResponse[] = [];
      for await (const chunk of aiService.generateStream(mockMessages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([mockStreamChunk, mockFinalChunk]);
      expect(mockPrimaryProvider.generateStream).toHaveBeenCalledWith(mockMessages, undefined);
    });

    it('should fallback to secondary provider for stream when primary fails', async () => {
      vi.mocked(mockPrimaryProvider.generateStream!).mockImplementation(async function* () {
        throw new Error('Primary stream failed');
      });

      vi.mocked(mockFallbackProvider.generateStream!).mockImplementation(async function* () {
        yield mockStreamChunk;
        yield mockFinalChunk;
      });

      const chunks: AIStreamResponse[] = [];
      for await (const chunk of aiService.generateStream(mockMessages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([mockStreamChunk, mockFinalChunk]);
      expect(mockFallbackProvider.generateStream).toHaveBeenCalledWith(mockMessages, undefined);
    });

    it('should throw AIServiceError when all providers fail for stream', async () => {
      vi.mocked(mockPrimaryProvider.generateStream!).mockImplementation(async function* () {
        throw new Error('Primary stream failed');
      });
      vi.mocked(mockFallbackProvider.generateStream!).mockImplementation(async function* () {
        throw new Error('Fallback stream failed');
      });

      async function consumeGenerator() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const chunk of aiService.generateStream(mockMessages)) {
          // Consume the stream to trigger the error
        }
      }

      await expect(consumeGenerator()).rejects.toThrow(AIServiceError);
    });

    it('should fallback to non-streaming when provider does not support streaming', async () => {
      mockPrimaryProvider.generateStream = undefined;

      const chunks: AIStreamResponse[] = [];
      for await (const chunk of aiService.generateStream(mockMessages)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        content: mockResponse.content,
        done: true,
        usage: mockResponse.usage
      });
      expect(mockPrimaryProvider.generateText).toHaveBeenCalled();
    });
  });

  describe('getProvidersHealth', () => {
    it('should return health status for all providers', async () => {
      const health = await aiService.getProvidersHealth();

      expect(health).toEqual({
        'primary-provider': { available: true },
        'fallback-provider': { available: true }
      });
    });

    it('should handle provider availability errors', async () => {
      vi.mocked(mockPrimaryProvider.isAvailable).mockRejectedValue(new Error('Health check failed'));

      const health = await aiService.getProvidersHealth();

      expect(health['primary-provider']).toEqual({
        available: false,
        error: 'Health check failed'
      });
      expect(health['fallback-provider']).toEqual({
        available: true
      });
    });

    it('should handle timeout in health checks', async () => {
      vi.mocked(mockPrimaryProvider.isAvailable).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 6000)) // Longer than service timeout
      );

      const health = await aiService.getProvidersHealth();

      expect(health['primary-provider']).toEqual({
        available: false,
        error: 'Operation timed out after 5000ms'
      });
    }, 10000); // Increase test timeout to 10 seconds
  });

  describe('service without fallback provider', () => {
    beforeEach(() => {
      const configWithoutFallback: AIServiceConfig = {
        primaryProvider: mockPrimaryProvider,
        retryAttempts: 3,
        retryDelay: 100,
        timeout: 5000
      };
      aiService = new AIService(configWithoutFallback);
    });

    it('should work with only primary provider', async () => {
      const result = await aiService.generateText(mockMessages);
      expect(result).toEqual(mockResponse);
    });

    it('should fail when primary provider fails and no fallback exists', async () => {
      vi.mocked(mockPrimaryProvider.generateText).mockRejectedValue(new Error('Primary failed'));

      await expect(aiService.generateText(mockMessages)).rejects.toThrow(AIServiceError);
    });
  });
});

describe('createAIService', () => {
  let mockCreateProvider: Mock;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreateProvider = createProvider as Mock;
    const { getAPIKey } = await import('../../src/ai/config.js');
    (getAPIKey as Mock).mockImplementation((provider: 'openrouter' | 'cloudflare') => {
      if (provider === 'openrouter') return 'test-key';
      return `${provider}-key`;
    });
  });

  it('should create AI service with default configuration', () => {
    mockCreateProvider.mockReturnValue({ name: 'mock-provider' });

    const service = createAIService();
    expect(service).toBeInstanceOf(AIService);
    expect(mockCreateProvider).toHaveBeenCalled();
  });

  it('should create AI service with custom configuration', () => {
    mockCreateProvider.mockReturnValue({ name: 'mock-provider' });

    const customConfig = {
      primary: { provider: 'cloudflare' as const, modelId: 'test-model' }
    };

    const service = createAIService(customConfig);
    expect(service).toBeInstanceOf(AIService);
    expect(mockCreateProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'cloudflare',
        modelId: 'test-model'
      })
    );
  });

  it('should fallback to Cloudflare when OpenRouter key is missing', async () => {
    // Mock getAPIKey to return undefined for openrouter
    const { getAPIKey } = await import('../../src/ai/config.js');
    (getAPIKey as Mock).mockImplementation((provider: 'openrouter' | 'cloudflare') => {
      if (provider === 'openrouter') return undefined;
      return `${provider}-key`;
    });

    mockCreateProvider.mockReturnValue({ name: 'mock-provider' });

    const service = createAIService();
    expect(service).toBeInstanceOf(AIService);
    expect(mockCreateProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'cloudflare',
      })
    );
  });

  it('should handle missing environment variables gracefully', () => {
    vi.stubGlobal('process', { env: {} });

    const service = createAIService();
    expect(service).toBeInstanceOf(AIService);
  });

  it('should handle fallback provider creation failure', () => {
    mockCreateProvider
      .mockReturnValueOnce({
        name: 'primary',
        isAvailable: vi.fn().mockResolvedValue(true),
        generateText: vi.fn()
      })
      .mockImplementationOnce(() => {
        throw new Error('Fallback creation failed');
      });

    // Should not throw, just log warning and continue without fallback
    const service = createAIService();
    expect(service).toBeInstanceOf(AIService);
  });
});