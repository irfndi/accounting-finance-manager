/**
 * Structured Logging Utilities
 * Enhanced logging for OCR operations and application events
 */

export interface LogContext {
  userId?: string;
  fileId?: string;
  fileName?: string;
  operation?: string;
  duration?: number;
  error?: Error | string;
  metadata?: Record<string, any>;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export class Logger {
  private context: LogContext;
  private component: string;

  constructor(component: string, context: LogContext = {}) {
    this.component = component;
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(this.component, {
      ...this.context,
      ...additionalContext
    });
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.log('DEBUG', message, context);
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | string, context?: LogContext): void {
    this.log('ERROR', message, {
      ...context,
      error
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      context: {
        ...this.context,
        ...context
      }
    };

    // Use appropriate console method based on level
    switch (level) {
      case 'DEBUG':
        console.debug(JSON.stringify(logEntry));
        break;
      case 'INFO':
        console.info(JSON.stringify(logEntry));
        break;
      case 'WARN':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'ERROR':
        console.error(JSON.stringify(logEntry));
        break;
    }
  }
}

/**
 * OCR-specific logger with predefined context
 */
export class OCRLogger extends Logger {
  constructor(context: LogContext = {}) {
    super('OCR_PIPELINE', context);
  }

  /**
   * Log OCR processing start
   */
  processingStart(fileId: string, fileName: string, mimeType: string): void {
    this.info('OCR processing started', {
      fileId,
      fileName,
      operation: 'OCR_START',
      metadata: { mimeType }
    });
  }

  /**
   * Log OCR processing success
   */
  processingSuccess(fileId: string, textLength: number, confidence?: number, duration?: number): void {
    this.info('OCR processing completed successfully', {
      fileId,
      operation: 'OCR_SUCCESS',
      duration,
      metadata: {
        textLength,
        confidence,
        wordsExtracted: Math.round(textLength / 5) // Rough word count
      }
    });
  }

  /**
   * Log OCR processing failure
   */
  processingFailure(fileId: string, error: Error | string, duration?: number): void {
    this.error('OCR processing failed', error, {
      fileId,
      operation: 'OCR_FAILURE',
      duration
    });
  }

  /**
   * Log database operations
   */
  databaseOperation(operation: string, fileId: string, success: boolean, error?: Error | string): void {
    if (success) {
      this.info(`Database operation successful: ${operation}`, {
        fileId,
        operation: `DB_${operation.toUpperCase()}`
      });
    } else {
      this.error(`Database operation failed: ${operation}`, error, {
        fileId,
        operation: `DB_${operation.toUpperCase()}_FAILURE`
      });
    }
  }

  /**
   * Log file validation
   */
  fileValidation(fileId: string, fileName: string, mimeType: string, fileSize: number, valid: boolean, reason?: string): void {
    if (valid) {
      this.info('File validation passed', {
        fileId,
        fileName,
        operation: 'FILE_VALIDATION_SUCCESS',
        metadata: { mimeType, fileSize }
      });
    } else {
      this.warn('File validation failed', {
        fileId,
        fileName,
        operation: 'FILE_VALIDATION_FAILURE',
        metadata: { mimeType, fileSize, reason }
      });
    }
  }

  /**
   * Log R2 storage operations
   */
  storageOperation(operation: string, fileId: string, r2Key: string, success: boolean, error?: Error | string): void {
    if (success) {
      this.info(`R2 storage operation successful: ${operation}`, {
        fileId,
        operation: `R2_${operation.toUpperCase()}`,
        metadata: { r2Key }
      });
    } else {
      this.error(`R2 storage operation failed: ${operation}`, error, {
        fileId,
        operation: `R2_${operation.toUpperCase()}_FAILURE`,
        metadata: { r2Key }
      });
    }
  }
}

/**
 * Global logger factory
 */
export function createLogger(component: string, context?: LogContext): Logger {
  return new Logger(component, context);
}

/**
 * Create OCR-specific logger
 */
export function createOCRLogger(context?: LogContext): OCRLogger {
  return new OCRLogger(context);
}

/**
 * Error boundary utility for OCR operations
 */
export async function withOCRErrorBoundary<T>(
  operation: string,
  fn: () => Promise<T>,
  logger: OCRLogger,
  context?: LogContext
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const startTime = Date.now();
  
  try {
    logger.info(`Starting ${operation}`, {
      ...context,
      operation: operation.toUpperCase().replace(/\s+/g, '_')
    });
    
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.info(`${operation} completed successfully`, {
      ...context,
      operation: `${operation.toUpperCase().replace(/\s+/g, '_')}_SUCCESS`,
      duration
    });
    
    return { success: true, data: result };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error(`${operation} failed`, error, {
      ...context,
      operation: `${operation.toUpperCase().replace(/\s+/g, '_')}_FAILURE`,
      duration
    });
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Validation error types
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ProcessingError extends Error {
  constructor(message: string, public operation?: string, public originalError?: Error) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public operation?: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public operation?: string, public originalError?: Error) {
    super(message);
    this.name = 'StorageError';
  }
} 