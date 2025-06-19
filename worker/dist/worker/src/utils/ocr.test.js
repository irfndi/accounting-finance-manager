import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processOCR, validateOCRRequirements, isOCRSupported, getOCRMetrics, resetOCRMetrics } from './ocr';
import { createOCRLogger } from './logger';
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
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    })),
    ValidationError: class ValidationError extends Error {
        field;
        value;
        constructor(message, field, value) {
            super(message);
            this.field = field;
            this.value = value;
            this.name = 'ValidationError';
        }
    },
    ProcessingError: class ProcessingError extends Error {
        operation;
        originalError;
        constructor(message, operation, originalError) {
            super(message);
            this.operation = operation;
            this.originalError = originalError;
            this.name = 'ProcessingError';
        }
    },
    withOCRErrorBoundary: vi.fn()
}));
describe('Enhanced OCR Error Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetOCRMetrics();
    });
    describe('validateOCRRequirements', () => {
        it('should validate supported file types', () => {
            const result = validateOCRRequirements('image/jpeg', 1000000, 'test.jpg');
            expect(result.valid).toBe(true);
            expect(result.errorCode).toBeUndefined();
        });
        it('should reject unsupported file types', () => {
            const result = validateOCRRequirements('text/plain', 1000000, 'test.txt');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('UNSUPPORTED_FORMAT');
        });
        it('should reject files that are too large', () => {
            const result = validateOCRRequirements('image/jpeg', 50000000, 'large.jpg');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('FILE_TOO_LARGE');
        });
        it('should reject files that are too small', () => {
            const result = validateOCRRequirements('image/jpeg', 100, 'tiny.jpg');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('FILE_TOO_SMALL');
        });
    });
    describe('processOCR with retry mechanism', () => {
        it('should succeed on first attempt', async () => {
            const mockResponse = { text: 'Extracted text content' };
            mockAI.run.mockResolvedValueOnce(mockResponse);
            const fileData = new ArrayBuffer(1000);
            const result = await processOCR(mockAI, fileData, 'image/jpeg', {
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
            const result = await processOCR(mockAI, fileData, 'image/jpeg', {
                retryAttempts: 3,
                retryDelay: 10
            }, 'test-file-id', 'test.jpg');
            expect(result.success).toBe(true);
            expect(result.text).toBe('Success after retries');
            expect(mockAI.run).toHaveBeenCalledTimes(3);
        });
        it('should fail after max retries', async () => {
            const persistentError = new Error('Persistent AI service error');
            mockAI.run.mockRejectedValue(persistentError);
            const fileData = new ArrayBuffer(1000);
            const result = await processOCR(mockAI, fileData, 'image/jpeg', {
                retryAttempts: 2,
                retryDelay: 10
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
            const result = await processOCR(mockAI, fileData, 'image/jpeg', {
                retryAttempts: 1,
                enableFallback: true
            }, 'test-file-id', 'test.jpg');
            expect(result.success).toBe(true);
            expect(result.fallbackUsed).toBe(true);
            expect(result.text).toContain('OCR processing failed');
        });
        it('should handle timeout errors', async () => {
            mockAI.run.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ text: 'Too slow' }), 2000)));
            const fileData = new ArrayBuffer(1000);
            const result = await processOCR(mockAI, fileData, 'image/jpeg', {
                timeout: 100,
                retryAttempts: 1
            }, 'test-file-id', 'test.jpg');
            expect(result.success).toBe(false);
            expect(result.errorCode).toBeDefined();
        });
        it('should truncate long text', async () => {
            const longText = 'A'.repeat(60000);
            mockAI.run.mockResolvedValueOnce({ text: longText });
            const fileData = new ArrayBuffer(1000);
            const result = await processOCR(mockAI, fileData, 'image/jpeg', {
                maxTextLength: 1000
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
            await processOCR(mockAI, fileData, 'image/jpeg', {}, 'test-1', 'test1.jpg');
            const metrics = getOCRMetrics();
            expect(metrics.totalAttempts).toBe(1);
            expect(metrics.successfulAttempts).toBe(1);
            expect(metrics.failedAttempts).toBe(0);
        });
        it('should track failed processing with error codes', async () => {
            mockAI.run.mockRejectedValue(new Error('AI Error'));
            const fileData = new ArrayBuffer(1000);
            await processOCR(mockAI, fileData, 'image/jpeg', {
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
            await processOCR(mockAI, fileData, 'image/jpeg', {
                retryAttempts: 1,
                enableFallback: true
            }, 'test-3', 'test3.jpg');
            const metrics = getOCRMetrics();
            expect(metrics.fallbackUsageCount).toBe(1);
        });
        it('should calculate average processing time', async () => {
            mockAI.run.mockResolvedValue({ text: 'Success' });
            const fileData = new ArrayBuffer(1000);
            // Process multiple files
            await processOCR(mockAI, fileData, 'image/jpeg', {}, 'test-4a', 'test4a.jpg');
            await processOCR(mockAI, fileData, 'image/jpeg', {}, 'test-4b', 'test4b.jpg');
            const metrics = getOCRMetrics();
            expect(metrics.totalAttempts).toBe(2);
            expect(metrics.averageProcessingTime).toBeGreaterThan(0);
        });
    });
    describe('Error Classification', () => {
        it('should classify validation errors correctly', async () => {
            const fileData = new ArrayBuffer(100); // Too small
            const result = await processOCR(mockAI, fileData, 'image/jpeg', {}, 'test-5', 'test5.jpg');
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('FILE_TOO_SMALL');
        });
        it('should classify unsupported format errors', async () => {
            const fileData = new ArrayBuffer(1000);
            const result = await processOCR(mockAI, fileData, 'text/plain', {}, 'test-6', 'test6.txt');
            console.log('Test result:', JSON.stringify(result, null, 2));
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('UNSUPPORTED_FORMAT');
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
