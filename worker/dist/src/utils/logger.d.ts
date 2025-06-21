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
export declare class Logger {
    private context;
    private component;
    constructor(component: string, context?: LogContext);
    /**
     * Create a child logger with additional context
     */
    child(additionalContext: LogContext): Logger;
    /**
     * Log debug messages (development only)
     */
    debug(message: string, context?: LogContext): void;
    /**
     * Log informational messages
     */
    info(message: string, context?: LogContext): void;
    /**
     * Log warning messages
     */
    warn(message: string, context?: LogContext): void;
    /**
     * Log error messages
     */
    error(message: string, error?: Error | string, context?: LogContext): void;
    /**
     * Core logging method
     */
    private log;
}
/**
 * OCR-specific logger with predefined context
 */
export declare class OCRLogger extends Logger {
    constructor(context?: LogContext);
    /**
     * Log OCR processing start
     */
    processingStart(fileId: string, fileName: string, mimeType: string): void;
    /**
     * Log OCR processing success
     */
    processingSuccess(fileId: string, textLength: number, confidence?: number, duration?: number): void;
    /**
     * Log OCR processing failure
     */
    processingFailure(fileId: string, error: Error | string, duration?: number): void;
    /**
     * Log database operations
     */
    databaseOperation(operation: string, fileId: string, success: boolean, error?: Error | string): void;
    /**
     * Log file validation
     */
    fileValidation(fileId: string, fileName: string, mimeType: string, fileSize: number, valid: boolean, reason?: string): void;
    /**
     * Log R2 storage operations
     */
    storageOperation(operation: string, fileId: string, r2Key: string, success: boolean, error?: Error | string): void;
}
/**
 * Global logger factory
 */
export declare function createLogger(component: string, context?: LogContext): Logger;
/**
 * Create OCR-specific logger
 */
export declare function createOCRLogger(context?: LogContext): OCRLogger;
/**
 * Error boundary utility for OCR operations
 */
export declare function withOCRErrorBoundary<T>(operation: string, fn: () => Promise<T>, logger: OCRLogger, context?: LogContext): Promise<{
    success: true;
    data: T;
} | {
    success: false;
    error: string;
}>;
/**
 * Validation error types
 */
export declare class ValidationError extends Error {
    field?: string | undefined;
    value?: any | undefined;
    constructor(message: string, field?: string | undefined, value?: any | undefined);
}
export declare class ProcessingError extends Error {
    operation?: string | undefined;
    originalError?: Error | undefined;
    constructor(message: string, operation?: string | undefined, originalError?: Error | undefined);
}
export declare class DatabaseError extends Error {
    operation?: string | undefined;
    originalError?: Error | undefined;
    constructor(message: string, operation?: string | undefined, originalError?: Error | undefined);
}
export declare class StorageError extends Error {
    operation?: string | undefined;
    originalError?: Error | undefined;
    constructor(message: string, operation?: string | undefined, originalError?: Error | undefined);
}
