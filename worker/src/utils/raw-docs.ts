/**
 * Raw Documents Database Utilities
 * Handles CRUD operations for the raw_docs table
 */

import { eq, desc, like, or, and, gte, lte, count } from "drizzle-orm";
import { rawDocs, type RawDoc, type NewRawDoc, type UpdateRawDoc, type Database } from "@finance-manager/db";
import { createOCRLogger, DatabaseError, withOCRErrorBoundary } from './logger';

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
  structuredData?: string; // JSON string
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
export async function createRawDoc(
  db: Database,
  data: CreateRawDocData
): Promise<{ success: true; doc: RawDoc } | { success: false; error: string }> {
  const logger = createOCRLogger({ 
    fileId: data.fileId,
    fileName: data.originalName,
    userId: data.uploadedBy
  });

  try {
    const result = await withOCRErrorBoundary(
      'Create Raw Document',
      async () => {
        const now = new Date();
        const tagsString = data.tags ? data.tags.join(',') : '';

        const newDoc: NewRawDoc = {
          fileId: data.fileId,
          originalName: data.originalName,
          mimeType: data.mimeType,
          fileSize: data.fileSize,
          r2Key: data.r2Key,
          r2Bucket: 'FINANCE_MANAGER_DOCUMENTS',
          uploadedBy: data.uploadedBy,
          description: data.description || null,
          tags: tagsString || null,
          entityId: data.entityId || null,
          ocrStatus: 'PENDING',
          textLength: 0,
          createdAt: now,
          updatedAt: now,
          createdBy: data.uploadedBy,
          updatedBy: data.uploadedBy
        };

        // Insert the document
        const insertResult = await db.insert(rawDocs).values(newDoc).returning();
        return insertResult[0];
      },
      logger
    );

    if (result.success === false) {
      logger.databaseOperation('create', data.fileId, false, result.error);
      return { success: false, error: result.error };
    }

    logger.databaseOperation('create', data.fileId, true);
    return { success: true, doc: result.data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.databaseOperation('create', data.fileId, false, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update OCR results for a raw document
 */
export async function updateRawDocOCR(
  db: Database,
  fileId: string,
  ocrData: UpdateOCRData,
  updatedBy?: string
): Promise<{ success: true; doc: RawDoc } | { success: false; error: string }> {
  const logger = createOCRLogger({ 
    fileId,
    userId: updatedBy
  });

  try {
    const result = await withOCRErrorBoundary(
      'Update Raw Document OCR',
      async () => {
        const now = new Date();
        
        // Generate searchable text if extracted text is provided
        let searchableText: string | undefined;
        if (ocrData.extractedText) {
          searchableText = generateSearchableText(ocrData.extractedText);
        }

        const updateData: Partial<UpdateRawDoc> = {
          extractedText: ocrData.extractedText,
          textLength: ocrData.extractedText?.length || 0,
          ocrConfidence: ocrData.ocrConfidence,
          ocrProcessingTime: ocrData.ocrProcessingTime,
          ocrStatus: ocrData.ocrStatus,
          ocrErrorMessage: ocrData.ocrErrorMessage,
          searchableText: searchableText,
          ocrProcessedAt: ocrData.ocrProcessedAt || null,
          updatedAt: now,
          updatedBy: updatedBy || null
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key as keyof typeof updateData] === undefined) {
            delete updateData[key as keyof typeof updateData];
          }
        });

        // Update the document
        const updatedDocs = await db.update(rawDocs)
          .set(updateData)
          .where(eq(rawDocs.fileId, fileId))
          .returning();

        if (!updatedDocs || updatedDocs.length === 0) {
          throw new DatabaseError(`Document not found: ${fileId}`, 'UPDATE');
        }

        return updatedDocs[0];
      },
      logger
    );

    if (result.success === false) {
      logger.databaseOperation('update', fileId, false, result.error);
      return { success: false, error: result.error };
    }

    logger.databaseOperation('update_ocr', fileId, true);
    return { success: true, doc: result.data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.databaseOperation('update_ocr', fileId, false, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update LLM processing results for a raw document
 */
export async function updateRawDocLLM(
  db: Database,
  fileId: string,
  llmData: UpdateLLMData,
  updatedBy?: string
): Promise<{ success: true; doc: RawDoc } | { success: false; error: string }> {
  const logger = createOCRLogger({ 
    fileId,
    userId: updatedBy
  });

  try {
    const result = await withOCRErrorBoundary(
      'Update Raw Document LLM',
      async () => {
        const now = new Date();
        
        const updateData: Partial<UpdateRawDoc> = {
          documentType: llmData.documentType || null,
          structuredData: llmData.structuredData || null,
          llmConfidence: llmData.llmConfidence || null,
          llmProcessedAt: llmData.llmProcessedAt || null,
          updatedAt: now,
          updatedBy: updatedBy || null
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key as keyof typeof updateData] === undefined) {
            delete updateData[key as keyof typeof updateData];
          }
        });

        // Update the document
        const updatedDocs = await db.update(rawDocs)
          .set(updateData)
          .where(eq(rawDocs.fileId, fileId))
          .returning();

        if (!updatedDocs || updatedDocs.length === 0) {
          throw new DatabaseError(`Document not found: ${fileId}`, 'UPDATE');
        }

        return updatedDocs[0];
      },
      logger
    );

    if (result.success === false) {
      logger.databaseOperation('update', fileId, false, result.error);
      return { success: false, error: result.error };
    }

    logger.databaseOperation('update_llm', fileId, true);
    return { success: true, doc: result.data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.databaseOperation('update_llm', fileId, false, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get a raw document by file ID
 */
export async function getRawDocByFileId(
  db: Database,
  fileId: string
): Promise<{ success: true; doc: RawDoc } | { success: false; error: string }> {
  const logger = createOCRLogger({ fileId });

  try {
    const result = await withOCRErrorBoundary(
      'Get Raw Document by File ID',
      async () => {
        const docs = await db.select()
          .from(rawDocs)
          .where(eq(rawDocs.fileId, fileId))
          .limit(1);

        if (!docs || docs.length === 0) {
          throw new DatabaseError(`Document not found: ${fileId}`, 'SELECT');
        }

        return docs[0];
      },
      logger
    );

    if (result.success === false) {
      logger.databaseOperation('get', fileId, false, result.error);
      return { success: false, error: result.error };
    }

    logger.databaseOperation('get', fileId, true);
    return { success: true, doc: result.data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.databaseOperation('get', fileId, false, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Search raw documents with filters
 */
export async function searchRawDocs(
  db: Database,
  filters: SearchFilters = {},
  limit: number = 50,
  offset: number = 0
): Promise<{ success: true; docs: RawDoc[]; total: number } | { success: false; error: string }> {
  const logger = createOCRLogger({ 
    userId: filters.userId,
    operation: 'SEARCH_DOCUMENTS'
  });

  try {
    const result = await withOCRErrorBoundary(
      'Search Raw Documents',
      async () => {
        let query = db.select().from(rawDocs);

        // Build WHERE conditions
        const conditions = [];

        if (filters.userId) {
          conditions.push(eq(rawDocs.uploadedBy, filters.userId));
        }

        if (filters.category) {
          conditions.push(eq(rawDocs.category, filters.category));
        }

        if (filters.documentType) {
          conditions.push(eq(rawDocs.documentType, filters.documentType));
        }

        if (filters.ocrStatus) {
          conditions.push(eq(rawDocs.ocrStatus, filters.ocrStatus));
        }

        if (filters.tags && filters.tags.length > 0) {
          const tagConditions = filters.tags.map(tag => 
            like(rawDocs.tags, `%${tag}%`)
          );
          conditions.push(or(...tagConditions));
        }

        if (filters.dateFrom) {
          conditions.push(gte(rawDocs.createdAt, filters.dateFrom));
        }

        if (filters.dateTo) {
          conditions.push(lte(rawDocs.createdAt, filters.dateTo));
        }

        if (filters.textSearch) {
          const textConditions = [
            like(rawDocs.originalName, `%${filters.textSearch}%`),
            like(rawDocs.description, `%${filters.textSearch}%`),
            like(rawDocs.searchableText, `%${filters.textSearch}%`)
          ];
          conditions.push(or(...textConditions));
        }

        // Apply conditions
        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any;
        }

        // Get total count
        const countQuery = conditions.length > 0 
          ? db.select({ count: count() }).from(rawDocs).where(and(...conditions))
          : db.select({ count: count() }).from(rawDocs);
        const totalResult = await countQuery;
        const total = totalResult[0]?.count || 0;

        // Apply ordering, limit, and offset
        const docs = await query
          .orderBy(desc(rawDocs.createdAt))
          .limit(limit)
          .offset(offset);

        return { docs, total };
      },
      logger
    );

    if (result.success === false) {
      logger.databaseOperation('search', 'multiple', false, result.error);
      return { success: false, error: result.error };
    }

    logger.databaseOperation('search', 'multiple', true);
    logger.info('Document search completed', {
      operation: 'SEARCH_SUCCESS',
      metadata: {
        documentsFound: result.data.docs.length,
        totalDocuments: result.data.total,
        filtersApplied: Object.keys(filters).length
      }
    });

    return { success: true, docs: result.data.docs, total: result.data.total };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.databaseOperation('search', 'multiple', false, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a raw document record
 */
export async function deleteRawDoc(
  db: Database,
  fileId: string,
  deletedBy?: string
): Promise<{ success: true; doc: RawDoc } | { success: false; error: string }> {
  const logger = createOCRLogger({ 
    fileId,
    userId: deletedBy
  });

  try {
    const result = await withOCRErrorBoundary(
      'Delete Raw Document',
      async () => {
        const deletedDocs = await db.delete(rawDocs)
          .where(eq(rawDocs.fileId, fileId))
          .returning();

        if (!deletedDocs || deletedDocs.length === 0) {
          throw new DatabaseError(`Document not found: ${fileId}`, 'DELETE');
        }

        return deletedDocs[0];
      },
      logger
    );

    if (result.success === false) {
      logger.databaseOperation('delete', fileId, false, result.error);
      return { success: false, error: result.error };
    }

    logger.databaseOperation('delete', fileId, true);
    return { success: true, doc: result.data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.databaseOperation('delete', fileId, false, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Generate searchable text from extracted content
 * Normalizes text for better search performance
 */
export function generateSearchableText(extractedText: string): string {
  return extractedText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace non-word characters with spaces
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Parse tags from comma-separated string
 */
export function parseTags(tagsString: string | null): string[] {
  if (!tagsString) return [];
  
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Format tags array as comma-separated string
 */
export function formatTags(tags: string[]): string {
  return tags
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .join(',');
}

/**
 * Get OCR processing statistics
 */
export async function getOCRStats(
  db: Database,
  userId?: string
): Promise<{ 
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
  }
} | { success: false; error: string }> {
  const logger = createOCRLogger({ 
    userId,
    operation: 'GET_OCR_STATS'
  });

  try {
    const result = await withOCRErrorBoundary(
      'Get OCR Statistics',
      async () => {
        const baseQuery = db.select().from(rawDocs);
        const query = userId 
          ? baseQuery.where(eq(rawDocs.uploadedBy, userId))
          : baseQuery;

        const docs = await query;

        const stats = {
          total: docs.length,
          pending: docs.filter(d => d.ocrStatus === 'PENDING').length,
          processing: docs.filter(d => d.ocrStatus === 'PROCESSING').length,
          completed: docs.filter(d => d.ocrStatus === 'COMPLETED').length,
          failed: docs.filter(d => d.ocrStatus === 'FAILED').length,
          avgProcessingTime: 0,
          avgConfidence: 0,
          totalTextLength: 0
        };

        const completedDocs = docs.filter(d => d.ocrStatus === 'COMPLETED');
        
        if (completedDocs.length > 0) {
          const totalProcessingTime = completedDocs.reduce((sum, doc) => 
            sum + (doc.ocrProcessingTime || 0), 0);
          stats.avgProcessingTime = totalProcessingTime / completedDocs.length;

          const totalConfidence = completedDocs.reduce((sum, doc) => 
            sum + (doc.ocrConfidence || 0), 0);
          stats.avgConfidence = totalConfidence / completedDocs.length;

          stats.totalTextLength = completedDocs.reduce((sum, doc) => 
            sum + (doc.textLength || 0), 0);
        }

        return stats;
      },
      logger,
      { operation: 'GET_STATS' }
    );

    if (result.success === false) {
      logger.databaseOperation('stats', 'multiple', false, 'Failed to get OCR statistics');
      return result;
    }

    logger.databaseOperation('stats', 'multiple', true);
    logger.info('OCR statistics retrieved', {
      operation: 'STATS_SUCCESS',
      metadata: result.data
    });

    return { success: true, data: result.data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.databaseOperation('stats', 'multiple', false, error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: errorMessage };
  }
}

/**
 * Get upload statistics
 */
export async function getUploadStats(
  db: Database,
  userId?: string
): Promise<{ 
  success: true; 
  data: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalSize: number;
    avgFileSize: number;
  }
} | { success: false; error: string }> {
  const logger = createOCRLogger({ 
    userId,
    operation: 'GET_UPLOAD_STATS'
  });

  try {
    const result = await withOCRErrorBoundary(
      'Get Upload Statistics',
      async () => {
        const baseQuery = db.select().from(rawDocs);
        const query = userId 
          ? baseQuery.where(eq(rawDocs.uploadedBy, userId))
          : baseQuery;

        const docs = await query;

        const stats = {
          total: docs.length,
          pending: docs.filter(d => d.ocrStatus === 'PENDING').length,
          processing: docs.filter(d => d.ocrStatus === 'PROCESSING').length,
          completed: docs.filter(d => d.ocrStatus === 'COMPLETED').length,
          failed: docs.filter(d => d.ocrStatus === 'FAILED').length,
          totalSize: docs.reduce((sum, doc) => sum + (doc.fileSize || 0), 0),
          avgFileSize: 0
        };

        if (docs.length > 0) {
          stats.avgFileSize = stats.totalSize / docs.length;
        }

        return stats;
      },
      logger,
      { operation: 'GET_UPLOAD_STATS' }
    );

    if (result.success === false) {
      logger.databaseOperation('stats', 'multiple', false, 'Failed to get upload statistics');
      return result;
    }

    logger.databaseOperation('stats', 'multiple', true);
    logger.info('Upload statistics retrieved', {
      operation: 'UPLOAD_STATS_SUCCESS',
      metadata: result.data
    });

    return { success: true, data: result.data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.databaseOperation('stats', 'multiple', false, error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: errorMessage };
  }
}