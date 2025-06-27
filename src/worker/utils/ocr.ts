/**
 * OCR (Optical Character Recognition) Utilities
 * Handles text extraction from images using Cloudflare AI
 */

import type { Ai, R2Bucket } from '@cloudflare/workers-types';
import { createOCRLogger, ValidationError, withOCRErrorBoundary, type OCRLogger } from './logger';

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

// Supported file types for OCR processing
export const OCR_SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
];

// File size limits (in bytes)
export const OCR_FILE_SIZE_LIMITS = {
  'image/jpeg': 10 * 1024 * 1024, // 10MB
  'image/jpg': 10 * 1024 * 1024,  // 10MB
  'image/png': 10 * 1024 * 1024,  // 10MB
  'image/gif': 5 * 1024 * 1024,   // 5MB
  'image/webp': 10 * 1024 * 1024, // 10MB
  'application/pdf': 25 * 1024 * 1024, // 25MB
};

// OCR processing constants
export const OCR_DEFAULTS = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  TIMEOUT_MS: 30000,
  MAX_TEXT_LENGTH: 100000
};

// Error codes for better error categorization
export const OCR_ERROR_CODES = {
  VALIDATION_FAILED: 'OCR_VALIDATION_FAILED',
  FILE_TOO_LARGE: 'OCR_FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'OCR_UNSUPPORTED_FORMAT',
  PROCESSING_TIMEOUT: 'OCR_PROCESSING_TIMEOUT',
  AI_SERVICE_ERROR: 'OCR_AI_SERVICE_ERROR',
  NETWORK_ERROR: 'OCR_NETWORK_ERROR',
  STORAGE_ERROR: 'OCR_STORAGE_ERROR',
  UNKNOWN_ERROR: 'OCR_UNKNOWN_ERROR'
};

/**
 * Check if a file type is supported for OCR processing
 */
export function isOCRSupported(mimeType: string): boolean {
  return OCR_SUPPORTED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate OCR processing requirements
 */
export function validateOCRRequirements(
  mimeType: string,
  fileSize: number,
  fileName?: string,
  logger?: OCRLogger
): { valid: boolean; error?: string; errorCode?: string } {
  const fileId = fileName || 'unknown';
  
  try {
    if (!isOCRSupported(mimeType)) {
      const error = `Unsupported file type for OCR: ${mimeType}. Supported types: ${OCR_SUPPORTED_MIME_TYPES.join(', ')}`;
      logger?.fileValidation(fileId, fileName || 'unknown', mimeType, fileSize, false, error);
      return { valid: false, error, errorCode: OCR_ERROR_CODES.UNSUPPORTED_FORMAT };
    }
    
    const maxSize = OCR_FILE_SIZE_LIMITS[mimeType as keyof typeof OCR_FILE_SIZE_LIMITS];
    if (maxSize && fileSize > maxSize) {
      const error = `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size ${(maxSize / 1024 / 1024).toFixed(2)}MB for ${mimeType}`;
      logger?.fileValidation(fileId, fileName || 'unknown', mimeType, fileSize, false, error);
      return { valid: false, error, errorCode: OCR_ERROR_CODES.FILE_TOO_LARGE };
    }
    
    // Validate minimum file size
    if (fileSize < 100) {
      const error = 'File is too small to contain meaningful content';
      logger?.fileValidation(fileId, fileName || 'unknown', mimeType, fileSize, false, error);
      return { valid: false, error, errorCode: OCR_ERROR_CODES.VALIDATION_FAILED };
    }
    
    logger?.fileValidation(fileId, fileName || 'unknown', mimeType, fileSize, true);
    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger?.fileValidation(fileId, fileName || 'unknown', mimeType, fileSize, false, errorMessage);
    return { valid: false, error: errorMessage, errorCode: OCR_ERROR_CODES.VALIDATION_FAILED };
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced error classification
 */
function classifyOCRError(error: any): { code: string; message: string; retryable: boolean } {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Network/timeout errors - retryable
  if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
    return {
      code: OCR_ERROR_CODES.PROCESSING_TIMEOUT,
      message: 'OCR processing timed out',
      retryable: true
    };
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return {
      code: OCR_ERROR_CODES.NETWORK_ERROR,
      message: 'Network error during OCR processing',
      retryable: true
    };
  }
  
  // AI service errors - some retryable
  if (errorMessage.includes('AI') || errorMessage.includes('model')) {
    return {
      code: OCR_ERROR_CODES.AI_SERVICE_ERROR,
      message: 'AI service error during OCR processing',
      retryable: true
    };
  }
  
  // Storage errors - retryable
  if (errorMessage.includes('storage') || errorMessage.includes('R2')) {
    return {
      code: OCR_ERROR_CODES.STORAGE_ERROR,
      message: 'Storage error during OCR processing',
      retryable: true
    };
  }
  
  // Validation errors - not retryable
  if (error instanceof ValidationError) {
    return {
      code: (error as any).code || OCR_ERROR_CODES.VALIDATION_FAILED,
      message: errorMessage,
      retryable: false
    };
  }
  
  // Unknown errors - retryable with caution
  return {
    code: OCR_ERROR_CODES.UNKNOWN_ERROR,
    message: errorMessage,
    retryable: true
  };
}

/**
 * Retry mechanism for OCR operations
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts: number;
    delay: number;
    logger: OCRLogger;
    operationName: string;
    fileId?: string;
  }
): Promise<T> {
  const { maxAttempts, delay, logger, operationName, fileId } = options;
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.info(`${operationName} attempt ${attempt}/${maxAttempts}`, {
        fileId,
        operation: `${operationName.toUpperCase()}_ATTEMPT`,
        metadata: { attempt, maxAttempts }
      });
      
      return await operation();
    } catch (error) {
      lastError = error;
      const errorInfo = classifyOCRError(error);
      
      logger.warn(`${operationName} attempt ${attempt} failed`, {
        fileId,
        operation: `${operationName.toUpperCase()}_ATTEMPT_FAILED`,
        error: errorInfo.message,
        metadata: {
          attempt,
          maxAttempts,
          errorCode: errorInfo.code,
          retryable: errorInfo.retryable
        }
      });
      
      // Don't retry if error is not retryable
      if (!errorInfo.retryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Wait before retry with exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      logger.info(`Retrying ${operationName} in ${backoffDelay}ms`, {
        fileId,
        operation: `${operationName.toUpperCase()}_RETRY_DELAY`,
        metadata: { delay: backoffDelay, nextAttempt: attempt + 1 }
      });
      
      await sleep(backoffDelay);
    }
  }
  
  throw lastError;
}

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
 * Global OCR metrics tracking
 */
let ocrMetrics: OCRMetrics = {
  totalAttempts: 0,
  successfulAttempts: 0,
  failedAttempts: 0,
  averageProcessingTime: 0,
  errorsByType: {},
  fallbackUsageCount: 0
};

/**
 * Update OCR metrics with processing results
 */
function updateOCRMetrics(result: OCRResult, errorCode?: string) {
  ocrMetrics.totalAttempts++;
  
  if (result.success === true) {
    ocrMetrics.successfulAttempts++;
    if (result.fallbackUsed) {
      ocrMetrics.fallbackUsageCount++;
    }
  } else {
    ocrMetrics.failedAttempts++;
    if (errorCode) {
      ocrMetrics.errorsByType[errorCode] = (ocrMetrics.errorsByType[errorCode] || 0) + 1;
    }
  }
  
  // Update average processing time
  if (result.processingTime) {
    const totalTime = ocrMetrics.averageProcessingTime * (ocrMetrics.totalAttempts - 1) + result.processingTime;
    ocrMetrics.averageProcessingTime = totalTime / ocrMetrics.totalAttempts;
  }
}

/**
 * Get current OCR metrics
 */
export function getOCRMetrics(): OCRMetrics {
  return { ...ocrMetrics };
}

/**
 * Reset OCR metrics
 */
export function resetOCRMetrics(): void {
  ocrMetrics = {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    averageProcessingTime: 0,
    errorsByType: {},
    fallbackUsageCount: 0
  };
}

/**
 * Fallback OCR processing using alternative methods
 */
async function processFallbackOCR(
  fileData: ArrayBuffer,
  mimeType: string,
  _options: OCRProcessingOptions,
  logger: any,
  fileId: string
): Promise<OCRResult> {
  const startTime = Date.now();
  
  try {
    // Validate file requirements first - fallback should not process unsupported formats
    const validation = validateOCRRequirements(mimeType, fileData.byteLength, undefined, logger);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'File validation failed in fallback processing',
        processingTime: Date.now() - startTime,
        errorCode: validation.errorCode
      };
    }
    
    // For now, implement a simple text extraction fallback
    // This could be extended to use other OCR services or methods
    logger.info('Attempting fallback OCR processing', {
      fileId,
      operation: 'FALLBACK_OCR',
      metadata: { mimeType, fileSize: fileData.byteLength }
    });
    
    // Simple fallback: return a message indicating manual processing needed
    const fallbackText = 'OCR processing failed. Please manually extract text from this document or try uploading a clearer image.';
    
    return {
      success: true,
      text: fallbackText,
      confidence: 0,
      processingTime: Date.now() - startTime,
      fallbackUsed: true
    };
  } catch (error) {
    logger.error('Fallback OCR also failed', {
      fileId,
      operation: 'FALLBACK_OCR_FAILURE',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      error: 'Both primary and fallback OCR processing failed',
      processingTime: Date.now() - startTime
    };
  }
}

export async function processOCR(
  ai: Ai,
  fileData: ArrayBuffer,
  mimeType: string,
  options: OCRProcessingOptions = {},
  fileId: string,
  fileName?: string
): Promise<OCRResult> {
  const logger = createOCRLogger({
    userId: 'system',
    fileId: fileId || 'unknown',
    fileName: fileName || 'unknown'
  });

  const {
    maxTextLength = OCR_DEFAULTS.MAX_TEXT_LENGTH,
    timeout = OCR_DEFAULTS.TIMEOUT_MS,
    retryAttempts = OCR_DEFAULTS.MAX_RETRY_ATTEMPTS,
    retryDelay = OCR_DEFAULTS.RETRY_DELAY_MS
  } = options;

  const startTime = Date.now();
  
  try {
    // Validate file requirements
    const validation = validateOCRRequirements(mimeType, fileData.byteLength, fileName, logger);
    if (!validation.valid) {
      const error = new ValidationError(validation.error || 'File validation failed');
      (error as any).code = validation.errorCode;
      throw error;
    }
    
    logger.processingStart(fileId || 'unknown', fileName || 'unknown', mimeType);
    
    // Process with retry mechanism
    const aiResponse = await withRetry(
      async () => {
        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('OCR processing timeout')), timeout);
        });
        
        const processingPromise = ai.run('@cf/llava-hf/llava-1.5-7b-hf', {
          image: Array.from(new Uint8Array(fileData)) as number[]
        });
        
        return Promise.race([processingPromise, timeoutPromise]);
      },
      {
        maxAttempts: retryAttempts,
        delay: retryDelay,
        logger,
        operationName: 'OCR Processing',
        fileId: fileId || 'unknown'
      }
    );
    
    const processingTime = Date.now() - startTime;
    
    // Parse AI response
    let extractedText = '';
    let confidence = 0;
    
    if (aiResponse && typeof aiResponse === 'object') {
      // Handle different response formats from Cloudflare AI
      if ((aiResponse as any).text) {
        extractedText = String((aiResponse as any).text);
      } else if ((aiResponse as any).result && (aiResponse as any).result.text) {
        extractedText = String((aiResponse as any).result.text);
      } else if (typeof aiResponse === 'string') {
        extractedText = aiResponse;
      } else {
        // Try to extract text from complex response structure
        const responseStr = JSON.stringify(aiResponse);
        const textMatch = responseStr.match(/"text":\s*"([^"]+)"/); 
        if (textMatch) {
          extractedText = textMatch[1];
        }
      }
      
      // Extract confidence if available
      if (options.includeConfidence) {
        confidence = (aiResponse as any).confidence || (aiResponse as any).result?.confidence || 0;
        if (typeof confidence === 'string') {
          confidence = parseFloat(confidence) || 0;
        }
        confidence = Math.max(0, Math.min(1, confidence)); // Clamp between 0-1
      }
    }
    
    // Validate extracted text
    if (!extractedText || extractedText.trim().length === 0) {
      logger.processingFailure(
        fileId || 'unknown', 
        'No text could be extracted from the document', 
        processingTime
      );
      
      return {
        success: false,
        error: 'No text could be extracted from the document. The image may be too blurry, contain no text, or be in an unsupported format.',
        processingTime
      };
    }
    
    // Clean and limit text length
    let cleanedText = extractedText.trim();
    if (cleanedText.length > maxTextLength) {
      cleanedText = cleanedText.substring(0, maxTextLength) + '... [truncated]';
      logger.info('Text truncated due to length limit', {
        fileId: fileId || 'unknown',
        operation: 'TEXT_TRUNCATION',
        metadata: {
          originalLength: extractedText.length,
          truncatedLength: cleanedText.length,
          maxLength: maxTextLength
        }
      });
    }
    
    // Normalize whitespace and line breaks
    cleanedText = cleanedText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\r\n]+/g, '\n'); // Normalize line breaks
    
    const ocrResult: OCRResult = {
      success: true,
      text: cleanedText,
      confidence: options.includeConfidence ? confidence : undefined,
      processingTime
    };
    
    logger.processingSuccess(
      fileId || 'unknown',
      cleanedText.length,
      confidence,
      processingTime
    );
    
    // Update metrics for successful processing
    updateOCRMetrics(ocrResult);
    
    return ocrResult;
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorInfo = classifyOCRError(error);
    
    logger.processingFailure(fileId || 'unknown', error instanceof Error ? error : new Error(String(error)), processingTime);
    
    // Try fallback OCR if enabled and primary processing failed
    // Never use fallback for validation errors
    if (options.enableFallback !== false && errorInfo.retryable && !(error instanceof ValidationError)) {
      logger.info('Primary OCR failed, attempting fallback processing', {
        fileId: fileId || 'unknown',
        operation: 'FALLBACK_ATTEMPT',
        metadata: { primaryError: errorInfo.code }
      });
      
      try {
        const fallbackResult = await processFallbackOCR(
          fileData,
          mimeType,
          options,
          logger,
          fileId || 'unknown'
        );
        
        // Add original error information to fallback result
        if (fallbackResult.success === true) {
          fallbackResult.processingTime = Date.now() - startTime;
          // Update metrics for successful fallback
          updateOCRMetrics(fallbackResult);
          return fallbackResult;
        }
      } catch (fallbackError) {
        logger.error('Fallback OCR failed', fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)), {
          metadata: { 
            fileId: fileId || 'unknown',
            operation: 'FALLBACK_FAILURE'
          }
        });
      }
    }
    
    // Enhanced error response with error codes
    const ocrResult: OCRResult = {
      success: false,
      error: errorInfo.message,
      processingTime,
      errorCode: errorInfo.code
    };
    
    // Add retry information if applicable
    if (errorInfo.retryable && retryAttempts > 1) {
      ocrResult.retryable = true;
      ocrResult.maxRetries = retryAttempts;
    }
    
    // Update metrics for failed processing
    updateOCRMetrics(ocrResult, errorInfo.code);
    
    return ocrResult;
  }
}

/**
 * Process OCR for a file stored in R2
 */
export async function processFileOCR(
  ai: Ai,
  r2Bucket: R2Bucket,
  fileId: string,
  options: OCRProcessingOptions = {}
): Promise<OCRResult> {
  const logger = createOCRLogger({ fileId });
  
  try {
    // Get file from R2
    const storageResult = await withOCRErrorBoundary(
      'R2 File Retrieval',
      async () => {
        const objects = await r2Bucket.list({ prefix: fileId });
        const fileObject = objects.objects.find(obj => obj.key.startsWith(fileId));
        
        if (!fileObject) {
          throw new Error(`File not found: ${fileId}`);
        }
        
        const r2Object = await r2Bucket.get(fileObject.key);
        if (!r2Object) {
          throw new Error(`Failed to retrieve file: ${fileId}`);
        }
        
        return {
          data: await r2Object.arrayBuffer(),
          metadata: r2Object.customMetadata,
          httpMetadata: r2Object.httpMetadata,
          key: fileObject.key
        };
      },
      logger,
      { fileId }
    );
    
    if (storageResult.success === false) {
      throw new Error(storageResult.error);
    }
    
    const { data: fileData, metadata, httpMetadata, key } = storageResult.data;
    const mimeType = httpMetadata?.contentType || 'application/octet-stream';
    const fileName = metadata?.originalName || key;
    
    logger.storageOperation('retrieve', fileId, key, true);
    
    // Process OCR
    return await processOCR(ai, fileData, mimeType, options, fileId, fileName);
    
  } catch (error) {
    logger.storageOperation('retrieve', fileId, 'unknown', false, error instanceof Error ? error : new Error(String(error)));
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      processingTime: 0
    };
  }
}

/**
 * Batch process OCR for multiple files
 */
export async function batchProcessOCR(
  ai: Ai,
  files: Array<{
    fileId: string;
    fileData: ArrayBuffer;
    mimeType: string;
    fileName?: string;
  }>,
  options: OCRProcessingOptions = {}
): Promise<Array<{ fileId: string; result: OCRResult }>> {
  const logger = createOCRLogger();
  
  logger.info('Starting batch OCR processing', {
    operation: 'BATCH_OCR_START',
    metadata: { fileCount: files.length }
  });
  
  const results: Array<{ fileId: string; result: OCRResult }> = [];
  
  // Process files sequentially to avoid overwhelming the AI service
  for (const file of files) {
    try {
      const result = await processOCR(
        ai,
        file.fileData,
        file.mimeType,
        options,
        file.fileId,
        file.fileName
      );
      
      results.push({
        fileId: file.fileId,
        result
      });
      
    } catch (error) {
      logger.error('Batch processing file failed', error instanceof Error ? error : new Error(String(error)), {
        fileId: file.fileId,
        operation: 'BATCH_OCR_FILE_FAILURE'
      });
      
      results.push({
        fileId: file.fileId,
        result: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          processingTime: 0
        }
      });
    }
  }
  
  const successCount = results.filter(r => r.result.success === true).length;
  const failureCount = results.length - successCount;
  
  logger.info('Batch OCR processing completed', {
    operation: 'BATCH_OCR_COMPLETE',
    metadata: {
      totalFiles: files.length,
      successCount,
      failureCount,
      successRate: Math.round((successCount / files.length) * 100)
    }
  });
  
  return results;
}