import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  processOCR,
  getOCRMetrics,
  resetOCRMetrics,
  isOCRSupported
} from './ocr';

// Mock Cloudflare AI
const mockAI = {
  run: vi.fn()
};

// Mock logger
vi.mock('./logger', () => ({
  createOCRLogger: vi.fn(() => ({
    processingStart: vi.fn(),
    processingSuccess: vi.fn(),
    processingFailure: vi.fn(),
    fileValidation: vi.fn(),
    storageOperation: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })),
  ValidationError: class ValidationError extends Error {
    constructor(message: string, public field?: string, public value?: any) {
      super(message);
      this.name = 'ValidationError';
    }
  },
  ProcessingError: class ProcessingError extends Error {
    constructor(message: string, public operation?: string, public originalError?: Error) {
      super(message);
      this.name = 'ProcessingError';
    }
  },
  withOCRErrorBoundary: vi.fn()
}));

describe('OCR Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetOCRMetrics();
    // Clear any previous mock implementations
    mockAI.run.mockReset();
  });

  afterEach(() => {
    // Clear any pending timeouts
    const timeoutIds = (global as any).__timeoutIds || [];
    timeoutIds.forEach((id: NodeJS.Timeout) => clearTimeout(id));
    (global as any).__timeoutIds = [];
  });



  describe('processOCR with retry mechanism', () => {
    it('should succeed on first attempt', async () => {
      const mockResponse = { text: 'Extracted text content' };
      mockAI.run.mockResolvedValue(mockResponse);

      const fileData = new ArrayBuffer(1000);
      const result = await processOCR(mockAI as any, fileData, 'image/jpeg', {
        retryAttempts: 3,
        includeConfidence: true
      }, 'test-file-id', 'test.jpg');

      expect(result.success).toBe(true);
      expect(result.text).toBe('Extracted text content');
      expect(result.fallbackUsed).toBeUndefined();
      expect(mockAI.run).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('Network timeout');
      mockAI.run
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ text: 'Success after retries' });

      const fileData = new ArrayBuffer(1000);
      const result = await processOCR(mockAI as any, fileData, 'image/jpeg', {
        retryAttempts: 3,
        retryDelay: 10
      }, 'test-file-id', 'test.jpg');

      expect(result.success).toBe(true);
      expect(result.text).toBe('Success after retries');
      expect(mockAI.run).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      mockAI.run.mockReset();
      const persistentError = new Error('Persistent AI service error');
      mockAI.run.mockRejectedValue(persistentError);

      const fileData = new ArrayBuffer(1000);
      const result = await processOCR(mockAI as any, fileData, 'image/jpeg', {
        retryAttempts: 2,
        retryDelay: 10,
        enableFallback: false // Disable fallback to test retry failure properly
      }, 'test-file-id', 'test.jpg');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBeDefined();
      expect(result.retryable).toBeDefined();
      expect(mockAI.run).toHaveBeenCalledTimes(2);
    });

    it('should use fallback when enabled', async () => {
      const aiError = new Error('AI service unavailable');
      mockAI.run.mockRejectedValue(aiError);

      const fileData = new ArrayBuffer(1000);
      const result = await processOCR(mockAI as any, fileData, 'image/jpeg', {
        retryAttempts: 1,
        enableFallback: true
      }, 'test-file-id', 'test.jpg');

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.text).toContain('OCR processing failed');
    });

    it('should handle timeout errors', async () => {
      // Reset any previous mock implementations
      mockAI.run.mockReset();
      // Create a mock that hangs for longer than timeout
      mockAI.run.mockImplementation(() => {
        return new Promise((resolve) => {
          // This will resolve after 1000ms, but timeout is 50ms
          setTimeout(() => resolve({ text: 'Too slow' }), 1000);
        });
      });

      const fileData = new ArrayBuffer(1000);
      
      // Test the timeout mechanism directly
      const startTime = Date.now();
      const result = await processOCR(mockAI as any, fileData, 'image/jpeg', {
        timeout: 50, // Very short timeout
        retryAttempts: 1, // Only try once
        enableFallback: false // Disable fallback to test timeout properly
      }, 'test-file-id', 'test.jpg');
      const endTime = Date.now();
      
      // Should complete quickly due to timeout
      expect(endTime - startTime).toBeLessThan(500);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBeDefined();
    });

    it('should truncate long text', async () => {
      const longText = 'A'.repeat(60000);
      mockAI.run.mockResolvedValueOnce({ text: longText });

      const fileData = new ArrayBuffer(1000);
      const result = await processOCR(mockAI as any, fileData, 'image/jpeg', {
        maxTextLength: 1000,
        enableFallback: false // Disable fallback to test retry failure properly
      }, 'test-file-id', 'test.jpg');

      expect(result.success).toBe(true);
      expect(result.text?.length).toBeLessThanOrEqual(1020); // 1000 + '... [truncated]'
      expect(result.text).toContain('[truncated]');
    });
  });

  describe('OCR Metrics Tracking', () => {
    it('should track successful processing', async () => {
      mockAI.run.mockResolvedValueOnce({ text: 'Success' });

      const fileData = new ArrayBuffer(1000);
      await processOCR(mockAI as any, fileData, 'image/jpeg', {}, 'test-1', 'test1.jpg');

      const metrics = getOCRMetrics();
      expect(metrics.totalAttempts).toBe(1);
      expect(metrics.successfulAttempts).toBe(1);
      expect(metrics.failedAttempts).toBe(0);
    });

    it('should track failed processing with error codes', async () => {
      mockAI.run.mockRejectedValue(new Error('AI Error'));

      const fileData = new ArrayBuffer(1000);
      await processOCR(mockAI as any, fileData, 'image/jpeg', {
        retryAttempts: 1,
        enableFallback: false
      }, 'test-2', 'test2.jpg');

      const metrics = getOCRMetrics();
      expect(metrics.totalAttempts).toBe(1);
      expect(metrics.successfulAttempts).toBe(0);
      expect(metrics.failedAttempts).toBe(1);
      expect(Object.keys(metrics.errorsByType).length).toBeGreaterThan(0);
    });

    it('should track fallback usage', async () => {
      mockAI.run.mockRejectedValue(new Error('AI Error'));

      const fileData = new ArrayBuffer(1000);
      await processOCR(mockAI as any, fileData, 'image/jpeg', {
        retryAttempts: 1,
        enableFallback: true
      }, 'test-3', 'test3.jpg');

      const metrics = getOCRMetrics();
      expect(metrics.fallbackUsageCount).toBe(1);
    });

    it('should calculate average processing time', async () => {
      // Reset any previous mock implementations
      mockAI.run.mockReset();
      // Mock AI with delay to simulate processing time
      mockAI.run.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ text: 'Success' }), 10))
      );

      const fileData = new ArrayBuffer(1000);
      
      // Process multiple files
      await processOCR(mockAI as any, fileData, 'image/jpeg', {}, 'test-4a', 'test4a.jpg');
      await processOCR(mockAI as any, fileData, 'image/jpeg', {}, 'test-4b', 'test4b.jpg');

      const metrics = getOCRMetrics();
      expect(metrics.totalAttempts).toBe(2);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('Error Classification', () => {
    it('should classify validation errors correctly', async () => {
      const fileData = new ArrayBuffer(50); // Too small
      const result = await processOCR(mockAI as any, fileData, 'image/jpeg', {}, 'test-file-id', 'test.jpg');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('OCR_VALIDATION_FAILED');
    });

    it('should classify unsupported format errors', async () => {
      const fileData = new ArrayBuffer(1000);
      const result = await processOCR(mockAI as any, fileData, 'text/plain', {}, 'test-file-id', 'test.txt');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('OCR_UNSUPPORTED_FORMAT');
    });
  });

  describe('isOCRSupported', () => {
    it('should support image formats', () => {
      expect(isOCRSupported('image/jpeg')).toBe(true);
      expect(isOCRSupported('image/png')).toBe(true);
      expect(isOCRSupported('image/gif')).toBe(true);
      expect(isOCRSupported('image/webp')).toBe(true);
    });

    it('should support PDF format', () => {
      expect(isOCRSupported('application/pdf')).toBe(true);
    });

    it('should not support unsupported formats', () => {
      expect(isOCRSupported('text/plain')).toBe(false);
      expect(isOCRSupported('application/json')).toBe(false);
      expect(isOCRSupported('video/mp4')).toBe(false);
    });
  });
});