/**
 * Structured Logging Utilities
 * Enhanced logging for OCR operations and application events
 */
export class Logger {
    context;
    component;
    constructor(component, context = {}) {
        this.component = component;
        this.context = context;
    }
    /**
     * Create a child logger with additional context
     */
    child(additionalContext) {
        return new Logger(this.component, {
            ...this.context,
            ...additionalContext
        });
    }
    /**
     * Log debug messages (development only)
     */
    debug(message, context) {
        this.log('DEBUG', message, context);
    }
    /**
     * Log informational messages
     */
    info(message, context) {
        this.log('INFO', message, context);
    }
    /**
     * Log warning messages
     */
    warn(message, context) {
        this.log('WARN', message, context);
    }
    /**
     * Log error messages
     */
    error(message, error, context) {
        this.log('ERROR', message, {
            ...context,
            error
        });
    }
    /**
     * Core logging method
     */
    log(level, message, context) {
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
    constructor(context = {}) {
        super('OCR_PIPELINE', context);
    }
    /**
     * Log OCR processing start
     */
    processingStart(fileId, fileName, mimeType) {
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
    processingSuccess(fileId, textLength, confidence, duration) {
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
    processingFailure(fileId, error, duration) {
        this.error('OCR processing failed', error, {
            fileId,
            operation: 'OCR_FAILURE',
            duration
        });
    }
    /**
     * Log database operations
     */
    databaseOperation(operation, fileId, success, error) {
        if (success) {
            this.info(`Database operation successful: ${operation}`, {
                fileId,
                operation: `DB_${operation.toUpperCase()}`
            });
        }
        else {
            this.error(`Database operation failed: ${operation}`, error, {
                fileId,
                operation: `DB_${operation.toUpperCase()}_FAILURE`
            });
        }
    }
    /**
     * Log file validation
     */
    fileValidation(fileId, fileName, mimeType, fileSize, valid, reason) {
        if (valid) {
            this.info('File validation passed', {
                fileId,
                fileName,
                operation: 'FILE_VALIDATION_SUCCESS',
                metadata: { mimeType, fileSize }
            });
        }
        else {
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
    storageOperation(operation, fileId, r2Key, success, error) {
        if (success) {
            this.info(`R2 storage operation successful: ${operation}`, {
                fileId,
                operation: `R2_${operation.toUpperCase()}`,
                metadata: { r2Key }
            });
        }
        else {
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
export function createLogger(component, context) {
    return new Logger(component, context);
}
/**
 * Create OCR-specific logger
 */
export function createOCRLogger(context) {
    return new OCRLogger(context);
}
/**
 * Error boundary utility for OCR operations
 */
export async function withOCRErrorBoundary(operation, fn, logger, context) {
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
    }
    catch (error) {
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
    field;
    value;
    constructor(message, field, value) {
        super(message);
        this.field = field;
        this.value = value;
        this.name = 'ValidationError';
    }
}
export class ProcessingError extends Error {
    operation;
    originalError;
    constructor(message, operation, originalError) {
        super(message);
        this.operation = operation;
        this.originalError = originalError;
        this.name = 'ProcessingError';
    }
}
export class DatabaseError extends Error {
    operation;
    originalError;
    constructor(message, operation, originalError) {
        super(message);
        this.operation = operation;
        this.originalError = originalError;
        this.name = 'DatabaseError';
    }
}
export class StorageError extends Error {
    operation;
    originalError;
    constructor(message, operation, originalError) {
        super(message);
        this.operation = operation;
        this.originalError = originalError;
        this.name = 'StorageError';
    }
}
