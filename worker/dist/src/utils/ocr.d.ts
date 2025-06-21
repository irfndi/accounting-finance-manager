/**
 * OCR (Optical Character Recognition) Utilities
 * Handles text extraction from images using Cloudflare AI
 */
import type { Ai, R2Bucket } from '@cloudflare/workers-types';
import { type OCRLogger } from './logger';
export interface OCRResult {
    success: boolean;
    text?: string;
    confidence?: number;
    error?: string;
    processingTime?: number;
    errorCode?: string;
    retryable?: boolean;
    maxRetries?: number;
    fallbackUsed?: boolean;
}
export interface OCRProcessingOptions {
    maxTextLength?: number;
    language?: string;
    includeConfidence?: boolean;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    enableFallback?: boolean;
}
export declare const OCR_SUPPORTED_MIME_TYPES: string[];
export declare const OCR_FILE_SIZE_LIMITS: {
    'image/jpeg': number;
    'image/jpg': number;
    'image/png': number;
    'image/gif': number;
    'image/webp': number;
    'application/pdf': number;
};
export declare const OCR_DEFAULTS: {
    MAX_RETRY_ATTEMPTS: number;
    RETRY_DELAY_MS: number;
    TIMEOUT_MS: number;
    MAX_TEXT_LENGTH: number;
};
export declare const OCR_ERROR_CODES: {
    VALIDATION_FAILED: string;
    FILE_TOO_LARGE: string;
    UNSUPPORTED_FORMAT: string;
    PROCESSING_TIMEOUT: string;
    AI_SERVICE_ERROR: string;
    NETWORK_ERROR: string;
    STORAGE_ERROR: string;
    UNKNOWN_ERROR: string;
};
/**
 * Check if a file type is supported for OCR processing
 */
export declare function isOCRSupported(mimeType: string): boolean;
/**
 * Validate OCR processing requirements
 */
export declare function validateOCRRequirements(mimeType: string, fileSize: number, fileName?: string, logger?: OCRLogger): {
    valid: boolean;
    error?: string;
    errorCode?: string;
};
/**
 * Process OCR using Cloudflare AI
 * Uses the @cf/tesseract-1.0.0 model for text extraction
 */
/**
 * OCR Performance Metrics Interface
 */
interface OCRMetrics {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageProcessingTime: number;
    errorsByType: Record<string, number>;
    fallbackUsageCount: number;
}
/**
 * Get current OCR metrics
 */
export declare function getOCRMetrics(): OCRMetrics;
/**
 * Reset OCR metrics
 */
export declare function resetOCRMetrics(): void;
export declare function processOCR(ai: Ai, fileData: ArrayBuffer, mimeType: string, options: OCRProcessingOptions | undefined, fileId: string, fileName?: string): Promise<OCRResult>;
/**
 * Process OCR for a file stored in R2
 */
export declare function processFileOCR(ai: Ai, r2Bucket: R2Bucket, fileId: string, options?: OCRProcessingOptions): Promise<OCRResult>;
/**
 * Batch process OCR for multiple files
 */
export declare function batchProcessOCR(ai: Ai, files: Array<{
    fileId: string;
    fileData: ArrayBuffer;
    mimeType: string;
    fileName?: string;
}>, options?: OCRProcessingOptions): Promise<Array<{
    fileId: string;
    result: OCRResult;
}>>;
export {};
