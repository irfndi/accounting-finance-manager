/**
 * Raw Documents Database Utilities
 * Handles CRUD operations for the raw_docs table
 */
import { type RawDoc, type Database } from "@finance-manager/db";
export interface CreateRawDocData {
    fileId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    fileSize: number;
    r2Key: string;
    uploadedBy: string;
    tags?: string[];
    description?: string;
    status: string;
    entityId?: string;
}
export interface UpdateOCRData {
    extractedText?: string;
    textLength?: number;
    ocrConfidence?: number;
    ocrProcessingTime?: number;
    ocrStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    ocrErrorMessage?: string;
    ocrErrorCode?: string;
    ocrFallbackUsed?: boolean;
    ocrRetryable?: boolean;
    ocrMaxRetries?: number;
    ocrProcessedAt?: Date;
    searchableText?: string;
}
export interface UpdateLLMData {
    documentType?: string;
    structuredData?: string;
    llmConfidence?: number;
    llmProcessedAt?: Date;
}
export interface SearchFilters {
    userId?: string;
    category?: string;
    documentType?: string;
    ocrStatus?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    textSearch?: string;
}
/**
 * Create a new raw document record in the database
 */
export declare function createRawDoc(db: Database, data: CreateRawDocData): Promise<{
    success: true;
    doc: RawDoc;
} | {
    success: false;
    error: string;
}>;
/**
 * Update OCR results for a raw document
 */
export declare function updateRawDocOCR(db: Database, fileId: string, ocrData: UpdateOCRData, updatedBy?: string): Promise<{
    success: true;
    doc: RawDoc;
} | {
    success: false;
    error: string;
}>;
/**
 * Update LLM processing results for a raw document
 */
export declare function updateRawDocLLM(db: Database, fileId: string, llmData: UpdateLLMData, updatedBy?: string): Promise<{
    success: true;
    doc: RawDoc;
} | {
    success: false;
    error: string;
}>;
/**
 * Get a raw document by file ID
 */
export declare function getRawDocByFileId(db: Database, fileId: string): Promise<{
    success: true;
    doc: RawDoc;
} | {
    success: false;
    error: string;
}>;
/**
 * Search raw documents with filters
 */
export declare function searchRawDocs(db: Database, filters?: SearchFilters, limit?: number, offset?: number): Promise<{
    success: true;
    docs: RawDoc[];
    total: number;
} | {
    success: false;
    error: string;
}>;
/**
 * Delete a raw document record
 */
export declare function deleteRawDoc(db: Database, fileId: string, deletedBy?: string): Promise<{
    success: true;
    doc: RawDoc;
} | {
    success: false;
    error: string;
}>;
/**
 * Generate searchable text from extracted content
 * Normalizes text for better search performance
 */
export declare function generateSearchableText(extractedText: string): string;
/**
 * Parse tags from comma-separated string
 */
export declare function parseTags(tagsString: string | null): string[];
/**
 * Format tags array as comma-separated string
 */
export declare function formatTags(tags: string[]): string;
/**
 * Get OCR processing statistics
 */
export declare function getOCRStats(db: Database, userId?: string): Promise<{
    success: true;
    data: {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        avgProcessingTime: number;
        avgConfidence: number;
        totalTextLength: number;
    };
} | {
    success: false;
    error: string;
}>;
/**
 * Get upload statistics
 */
export declare function getUploadStats(db: Database, userId?: string): Promise<{
    success: true;
    data: {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        totalSize: number;
        avgFileSize: number;
    };
} | {
    success: false;
    error: string;
}>;
