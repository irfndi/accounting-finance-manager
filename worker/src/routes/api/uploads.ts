import { Hono } from 'hono';
import type { D1Database, R2Bucket, KVNamespace, Ai, Vectorize } from '@cloudflare/workers-types';
import { authMiddleware, getCurrentUser } from '../../middleware/auth';
import { processOCR, isOCRSupported, validateOCRRequirements, type OCRResult } from '../../utils/ocr';
import { createDatabase } from '@finance-manager/db';
import { 
  createRawDoc, 
  updateRawDocOCR, 
  updateRawDocLLM,
  getRawDocByFileId, 
  generateSearchableText,
  parseTags,
  type CreateRawDocData,
  type UpdateOCRData
} from '../../utils/raw-docs';
import { createOCRLogger, createLogger, ValidationError, ProcessingError, StorageError } from '../../utils/logger';
import { FinancialAIService } from '@finance-manager/ai/services/financial-ai';
import { AIService } from '@finance-manager/ai/services/ai-service';
import { OpenRouterProvider } from '@finance-manager/ai/providers/openrouter';
import type { DocumentClassification } from '@finance-manager/ai/types';

type Env = {
  FINANCE_MANAGER_DB: D1Database;
  FINANCE_MANAGER_CACHE: KVNamespace;
  FINANCE_MANAGER_DOCUMENTS: R2Bucket;
  AI: Ai;
  DOCUMENT_EMBEDDINGS: Vectorize;
  JWT_SECRET?: string;
  ENVIRONMENT?: string;
  OPENROUTER_API_KEY?: string;
};

const uploads = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all upload routes
uploads.use('*', authMiddleware);

// File validation constants
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper function to generate UUIDs
function generateUUID(): string {
  return crypto.randomUUID();
}

// Helper function to create AI service
function createAIService(env: Env): FinancialAIService | null {
  try {
    if (!env.OPENROUTER_API_KEY) {
      console.warn('⚠️ OpenRouter API key not found, LLM features disabled');
      return null;
    }

    const provider = new OpenRouterProvider({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1'
    });

    const aiService = new AIService({
      provider,
      defaultModel: 'meta-llama/llama-3.1-8b-instruct:free'
    });

    return new FinancialAIService(aiService);
  } catch (error) {
    console.error('Failed to initialize AI service:', error);
    return null;
  }
}

// Helper function to generate document embeddings
async function generateDocumentEmbeddings(
  vectorize: Vectorize,
  fileId: string,
  text: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!text || text.trim().length === 0) {
      return { success: false, error: 'No text content to embed' };
    }

    // Prepare the vector data
    const vectorData = {
      id: fileId,
      values: [], // Vectorize will generate embeddings from the text
      metadata: {
        text: text.substring(0, 1000), // Store first 1000 chars for search
        fileId,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    // Insert the vector into Vectorize
    await vectorize.insert([vectorData]);
    
    console.log(`✅ Generated embeddings for document ${fileId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to generate embeddings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown embedding error' 
    };
  }
}

// Helper function to get file extension from filename
function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Helper function to validate file type
function isValidFileType(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type);
}

// Helper function to validate file size
function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

// Helper function to create file metadata
function createFileMetadata(file: File, fileId: string, userId: string) {
  return {
    id: fileId,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    uploadedBy: userId,
    uploadedAt: new Date().toISOString(),
    tags: [] as string[],
    description: ''
  };
}

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload a file to R2 storage
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags for the file
 *               description:
 *                 type: string
 *                 description: File description
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     size:
 *                       type: number
 *                     mimeType:
 *                       type: string
 *                     url:
 *                       type: string
 *                     uploadedAt:
 *                       type: string
 *       400:
 *         description: Invalid file or validation error
 *       413:
 *         description: File too large
 *       415:
 *         description: Unsupported file type
 */
uploads.post('/', async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user) {
      return c.json({
        success: false,
        error: 'User not authenticated'
      }, 401);
    }
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const tags = formData.get('tags') as string;
    const description = formData.get('description') as string;

    // Validate file exists
    if (!file || !file.name) {
      return c.json({
        success: false,
        error: 'No file provided'
      }, 400);
    }

    // Validate file type
    if (!isValidFileType(file)) {
      return c.json({
        success: false,
        error: 'Unsupported file type',
        allowedTypes: ALLOWED_MIME_TYPES
      }, 415);
    }

    // Validate file size
    if (!isValidFileSize(file)) {
      return c.json({
        success: false,
        error: 'File too large',
        maxSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }, 413);
    }

    // Generate unique file ID and name
    const fileId = generateUUID();
    const fileExtension = getFileExtension(file.name);
    const storedFileName = `${fileId}.${fileExtension}`;

    // Create file metadata
    const metadata = createFileMetadata(file, fileId, user.id);
    if (tags) {
      metadata.tags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    if (description) {
      metadata.description = description;
    }

    // Process OCR if file type is supported
    let ocrResult: OCRResult | null = null;
    let fileBuffer: ArrayBuffer | null = null;
    let documentClassification: DocumentClassification | null = null;
    let structuredData: any = null;
    
    if (isOCRSupported(file.type)) {
      try {
        // Get file buffer for OCR processing
        fileBuffer = await file.arrayBuffer();
        
        // Process OCR with Cloudflare AI
        ocrResult = await processOCR(c.env.AI, fileBuffer, file.type, {
          maxTextLength: 50000, // Limit text to 50KB
          includeConfidence: true
        });
        
        console.log(`OCR processing for ${fileId}:`, {
          success: ocrResult.success,
          textLength: ocrResult.text?.length || 0,
          processingTime: ocrResult.processingTime,
          errorCode: ocrResult.errorCode,
          fallbackUsed: ocrResult.fallbackUsed,
          retryable: ocrResult.retryable
        });

        // Process with LLM if OCR was successful
        if (ocrResult.success && ocrResult.text) {
          const aiService = createAIService(c.env);
          if (aiService) {
            try {
              // Classify the document
              documentClassification = await aiService.classifyDocument({
                text: ocrResult.text,
                confidence: ocrResult.confidence || 0
              });

              console.log(`Document classification for ${fileId}:`, {
                type: documentClassification.type,
                confidence: documentClassification.confidence,
                subtype: documentClassification.subtype
              });

              // Extract structured data based on classification
              if (documentClassification.confidence > 0.6) {
                structuredData = await aiService.extractDocumentData(
                  {
                    text: ocrResult.text,
                    confidence: ocrResult.confidence || 0
                  },
                  documentClassification.type === 'other' ? undefined : documentClassification.type
                );

                console.log(`Data extraction for ${fileId}:`, {
                  hasStructuredData: !!structuredData,
                  dataKeys: structuredData ? Object.keys(structuredData) : []
                });

                // Update database with LLM results
                try {
                  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
                  const llmUpdateResult = await updateRawDocLLM(
                    db,
                    fileId,
                    {
                      documentType: documentClassification.type,
                      structuredData: structuredData ? JSON.stringify(structuredData) : undefined,
                      llmConfidence: documentClassification.confidence,
                      llmProcessedAt: new Date()
                    },
                    user.id
                  );
                  
                  if (llmUpdateResult.success) {
                    console.log('✅ LLM data saved to database:', { fileId });
                  } else {
                    console.warn('⚠️ Failed to save LLM data to database:', llmUpdateResult.error);
                  }
                } catch (dbError) {
                  console.warn('⚠️ Database update for LLM data failed:', dbError);
                }

                // Generate document embeddings for semantic search
                 try {
                   const textForEmbedding = ocrResult.extractedText || '';
                   const embeddingMetadata = {
                     documentType: documentClassification.type,
                     confidence: documentClassification.confidence,
                     fileName: file.name,
                     fileType: file.type,
                     hasStructuredData: !!structuredData
                   };

                  const embeddingResult = await generateDocumentEmbeddings(
                    c.env.DOCUMENT_EMBEDDINGS,
                    fileId,
                    textForEmbedding,
                    embeddingMetadata
                  );

                  if (!embeddingResult.success) {
                    console.warn('⚠️ Failed to generate document embeddings:', embeddingResult.error);
                  }
                } catch (embeddingError) {
                  console.error('Embedding generation failed:', embeddingError);
                  // Continue with upload even if embedding generation fails
                }
              }
            } catch (aiError) {
              console.error('LLM processing failed:', aiError);
              // Continue with upload even if LLM processing fails
            }
          }
        }
      } catch (error) {
        console.error('OCR processing failed:', error);
        // Continue with upload even if OCR fails
        ocrResult = {
          success: false,
          error: 'OCR processing failed but file was uploaded successfully',
          errorCode: 'UNEXPECTED_ERROR',
          retryable: true
        };
      }
    }

    // Create file stream for R2 upload (recreate from buffer if OCR was processed)
    const fileStream = fileBuffer ? new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(fileBuffer!));
        controller.close();
      }
    }) : file.stream();

    // Upload to R2
    const uploadResult = await c.env.FINANCE_MANAGER_DOCUMENTS.put(storedFileName, fileStream, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `attachment; filename="${file.name}"`
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: user.id,
        uploadedAt: metadata.uploadedAt,
        tags: metadata.tags.join(','),
        description: metadata.description || '',
        // Store OCR results in metadata
        ocrProcessed: ocrResult ? 'true' : 'false',
        ocrSuccess: ocrResult?.success ? 'true' : 'false',
        ocrTextLength: ocrResult?.text?.length?.toString() || '0',
        ocrConfidence: ocrResult?.confidence?.toString() || '0',
        ocrProcessingTime: ocrResult?.processingTime?.toString() || '0',
        ocrText: ocrResult?.success && ocrResult.text ? 
          // Store first 1000 characters of OCR text in metadata
          ocrResult.text.substring(0, 1000) : '',
        // Store LLM processing results
        llmProcessed: documentClassification ? 'true' : 'false',
        documentType: documentClassification?.type || 'unknown',
        documentConfidence: documentClassification?.confidence?.toString() || '0',
        hasStructuredData: structuredData ? 'true' : 'false',
        structuredDataKeys: structuredData ? Object.keys(structuredData).join(',') : ''
      }
    });

    if (!uploadResult) {
      return c.json({
        success: false,
        error: 'Failed to upload file to storage'
      }, 500);
    }

    // Store file metadata and OCR results in database
    const logger = createOCRLogger({ 
      fileId,
      fileName: file.name,
      userId: user.id
    });

    try {
      const db = createDatabase(c.env.FINANCE_MANAGER_DB);
      
      // Create raw document record
      const createDocData: CreateRawDocData = {
        fileId: fileId,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        r2Key: storedFileName,
        uploadedBy: user.id,
        description: metadata.description,
        tags: metadata.tags,
        entityId: user.entityId
      };

      const createResult = await createRawDoc(db, createDocData);
      
      if (!createResult.success) {
        logger.databaseOperation('create', fileId, false, createResult.error);
        throw new Error(`Failed to create document record: ${createResult.error}`);
      }

      logger.databaseOperation('create', fileId, true);

      // Update with OCR results if processing was successful
      if (ocrResult) {
        const updateData: UpdateOCRData = {
          ocrStatus: ocrResult.success ? 'COMPLETED' : 'FAILED',
          extractedText: ocrResult.text || null,
          textLength: ocrResult.text?.length || 0,
          ocrConfidence: ocrResult.confidence,
          ocrProcessingTime: ocrResult.processingTime,
          ocrErrorMessage: ocrResult.error || null,
          ocrProcessedAt: new Date(),
          searchableText: ocrResult.text ? generateSearchableText(ocrResult.text) : null
        };

        const updateResult = await updateRawDocOCR(db, fileId, updateData, user.id);
        
        if (!updateResult.success) {
          logger.databaseOperation('update_ocr', fileId, false, updateResult.error);
          // Log warning but don't fail the upload
          logger.warn('Failed to update OCR results in database', {
            fileId,
            operation: 'OCR_UPDATE_WARNING',
            error: updateResult.error
          });
        } else {
          logger.databaseOperation('update_ocr', fileId, true);
        }
      }

      logger.info(`Stored document ${fileId} in database with ${ocrResult ? 'OCR' : 'no OCR'} processing`, {
        fileId,
        operation: 'UPLOAD_SUCCESS',
        metadata: {
          hasOCR: !!ocrResult,
          ocrSuccess: ocrResult?.success,
          fileSize: file.size,
          mimeType: file.type
        }
      });
      
    } catch (dbError) {
      logger.error('Failed to store document in database', dbError, {
        fileId,
        operation: 'DATABASE_FAILURE'
      });
      // Continue anyway - file was uploaded successfully to R2
    }

    // Generate file URL (for serving later)
    const fileUrl = `/api/uploads/${fileId}`;

    // Prepare response data
    const responseData = {
      id: fileId,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      url: fileUrl,
      uploadedAt: metadata.uploadedAt,
      tags: metadata.tags,
      description: metadata.description,
      // Include OCR results if processing was attempted
      ...(ocrResult && {
        ocr: {
          processed: true,
          success: ocrResult.success,
          textLength: ocrResult.text?.length || 0,
          confidence: ocrResult.confidence,
          processingTime: ocrResult.processingTime,
          preview: ocrResult.success && ocrResult.text ? 
            ocrResult.text.substring(0, 200) + (ocrResult.text.length > 200 ? '...' : '') : 
            null,
          error: ocrResult.error
        }
      }),
      // Include LLM results if processing was successful
      ...(documentClassification && {
        llm: {
          classification: {
            type: documentClassification.type,
            confidence: documentClassification.confidence,
            subtype: documentClassification.subtype
          },
          structuredData: structuredData || undefined
        }
      })
    };

    return c.json({
      success: true,
      data: responseData
    }, 201);

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({
      success: false,
      error: 'Internal server error during upload'
    }, 500);
  }
});

/**
 * @swagger
 * /api/uploads/{fileId}:
 *   get:
 *     summary: Download or serve a file from R2 storage
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *         description: Force download instead of inline display
 *     responses:
 *       200:
 *         description: File content
 *       404:
 *         description: File not found
 */
uploads.get('/:fileId', async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user) {
      return c.json({
        success: false,
        error: 'User not authenticated'
      }, 401);
    }
    const fileId = c.req.param('fileId');
    const forceDownload = c.req.query('download') === 'true';

    if (!fileId) {
      return c.json({
        success: false,
        error: 'File ID required'
      }, 400);
    }

    // List objects to find the file (since we need to find by UUID prefix)
    const objects = await c.env.FINANCE_MANAGER_DOCUMENTS.list({
      prefix: fileId
    });

    const fileObject = objects.objects.find(obj => obj.key.startsWith(fileId));
    
    if (!fileObject) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    // Get the file from R2
    const object = await c.env.FINANCE_MANAGER_DOCUMENTS.get(fileObject.key);
    
    if (!object) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    // Get original filename from metadata
    const originalName = object.customMetadata?.originalName || 'download';
    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', object.size.toString());
    
    if (forceDownload) {
      headers.set('Content-Disposition', `attachment; filename="${originalName}"`);
    } else {
      headers.set('Content-Disposition', `inline; filename="${originalName}"`);
    }

    return new Response(object.body, {
      headers
    });

  } catch (error) {
    console.error('Download error:', error);
    return c.json({
      success: false,
      error: 'Internal server error during download'
    }, 500);
  }
});

/**
 * @swagger
 * /api/uploads/{fileId}:
 *   delete:
 *     summary: Delete a file from R2 storage
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       403:
 *         description: Not authorized to delete this file
 */
uploads.delete('/:fileId', async (c) => {
  try {
    const user = c.get('user');
    const fileId = c.req.param('fileId');

    if (!fileId) {
      return c.json({
        success: false,
        error: 'File ID required'
      }, 400);
    }

    // Find the file
    const objects = await c.env.FINANCE_MANAGER_DOCUMENTS.list({
      prefix: fileId
    });

    const fileObject = objects.objects.find(obj => obj.key.startsWith(fileId));
    
    if (!fileObject) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    // Get file metadata to check ownership
    const object = await c.env.FINANCE_MANAGER_DOCUMENTS.get(fileObject.key);
    
    if (!object) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    // Check if user owns the file (or is admin)
    const uploadedBy = object.customMetadata?.uploadedBy;
    if (uploadedBy !== user.id && user.role !== 'ADMIN') {
      return c.json({
        success: false,
        error: 'Not authorized to delete this file'
      }, 403);
    }

    // Delete the file
    await c.env.FINANCE_MANAGER_DOCUMENTS.delete(fileObject.key);

    return c.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return c.json({
      success: false,
      error: 'Internal server error during deletion'
    }, 500);
  }
});

/**
 * @swagger
 * /api/uploads:
 *   get:
 *     summary: List uploaded files
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of files to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Pagination cursor
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *     responses:
 *       200:
 *         description: List of files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                     cursor:
 *                       type: string
 *                     hasMore:
 *                       type: boolean
 */
uploads.get('/', async (c) => {
  try {
    const user = c.get('user');
    const limit = parseInt(c.req.query('limit') || '50');
    const cursor = c.req.query('cursor');
    const tagFilter = c.req.query('tag');

    // List files from R2
    const listOptions: any = {
      limit: Math.min(limit, 100) // Cap at 100
    };
    
    if (cursor) {
      listOptions.cursor = cursor;
    }

    const result = await c.env.FINANCE_MANAGER_DOCUMENTS.list(listOptions);

    // Process files and extract metadata
    const files = await Promise.all(
      result.objects.map(async (obj) => {
        const object = await c.env.FINANCE_MANAGER_DOCUMENTS.get(obj.key);
        
        if (!object) return null;

        const metadata = {
          id: obj.key.split('.')[0], // Extract UUID from filename
          originalName: object.customMetadata?.originalName || obj.key,
          size: obj.size,
          mimeType: object.httpMetadata?.contentType || 'application/octet-stream',
          uploadedBy: object.customMetadata?.uploadedBy || '',
          uploadedAt: object.customMetadata?.uploadedAt || obj.uploaded.toISOString(),
          tags: object.customMetadata?.tags ? object.customMetadata.tags.split(',').filter(Boolean) : [],
          description: object.customMetadata?.description || '',
          url: `/api/uploads/${obj.key.split('.')[0]}`
        };

        // Filter by tag if specified
        if (tagFilter && !metadata.tags.includes(tagFilter)) {
          return null;
        }

        // Filter by user (non-admin users can only see their own files)
        if (user.role !== 'ADMIN' && metadata.uploadedBy !== user.id) {
          return null;
        }

        return metadata;
      })
    );

    // Filter out null results
    const validFiles = files.filter(file => file !== null);

    return c.json({
      success: true,
      data: {
        files: validFiles,
        cursor: result.cursor,
        hasMore: result.truncated,
        total: validFiles.length
      }
    });

  } catch (error) {
    console.error('List files error:', error);
    return c.json({
      success: false,
      error: 'Internal server error while listing files'
    }, 500);
  }
});

/**
 * @swagger
 * /api/uploads/{fileId}/metadata:
 *   get:
 *     summary: Get file metadata
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File metadata
 *       404:
 *         description: File not found
 */
uploads.get('/:fileId/metadata', async (c) => {
  try {
    const user = c.get('user');
    const fileId = c.req.param('fileId');

    if (!fileId) {
      return c.json({
        success: false,
        error: 'File ID required'
      }, 400);
    }

    // Find the file
    const objects = await c.env.FINANCE_MANAGER_DOCUMENTS.list({
      prefix: fileId
    });

    const fileObject = objects.objects.find(obj => obj.key.startsWith(fileId));
    
    if (!fileObject) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    // Get file metadata
    const object = await c.env.FINANCE_MANAGER_DOCUMENTS.get(fileObject.key);
    
    if (!object) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    // Check access permissions
    const uploadedBy = object.customMetadata?.uploadedBy;
    if (uploadedBy !== user.id && user.role !== 'ADMIN') {
      return c.json({
        success: false,
        error: 'Not authorized to access this file'
      }, 403);
    }

    const metadata = {
      id: fileId,
      originalName: object.customMetadata?.originalName || fileObject.key,
      size: fileObject.size,
      mimeType: object.httpMetadata?.contentType || 'application/octet-stream',
      uploadedBy: object.customMetadata?.uploadedBy || '',
      uploadedAt: object.customMetadata?.uploadedAt || fileObject.uploaded.toISOString(),
      tags: object.customMetadata?.tags ? object.customMetadata.tags.split(',').filter(Boolean) : [],
      description: object.customMetadata?.description || '',
      url: `/api/uploads/${fileId}`
    };

    return c.json({
      success: true,
      data: metadata
    });

  } catch (error) {
    console.error('Get metadata error:', error);
    return c.json({
      success: false,
      error: 'Internal server error while getting metadata'
    }, 500);
  }
});

/**
 * @swagger
 * /api/uploads/{fileId}/ocr:
 *   post:
 *     summary: Process OCR for an uploaded file
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *       - in: query
 *         name: reprocess
 *         schema:
 *           type: boolean
 *         description: Force reprocessing even if OCR data exists
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxTextLength:
 *                 type: number
 *                 description: Maximum text length to extract
 *               includeConfidence:
 *                 type: boolean
 *                 description: Include confidence scores in response
 *     responses:
 *       200:
 *         description: OCR processing completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileId:
 *                       type: string
 *                     ocr:
 *                       type: object
 *       400:
 *         description: Invalid request or file not suitable for OCR
 *       404:
 *         description: File not found
 */
uploads.post('/:fileId/ocr', async (c) => {
  try {
    const user = c.get('user');
    const fileId = c.req.param('fileId');
    const reprocess = c.req.query('reprocess') === 'true';

    if (!fileId) {
      return c.json({
        success: false,
        error: 'File ID required'
      }, 400);
    }

    // Get processing options from request body
    const body = c.req.header('content-type')?.includes('application/json') 
      ? await c.req.json().catch(() => ({}))
      : {};

    const options = {
      maxTextLength: body.maxTextLength || 50000,
      includeConfidence: body.includeConfidence !== false
    };

    // Find the file
    const objects = await c.env.FINANCE_MANAGER_DOCUMENTS.list({
      prefix: fileId
    });

    const fileObject = objects.objects.find(obj => obj.key.startsWith(fileId));
    
    if (!fileObject) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    // Get file metadata to check ownership and existing OCR data
    const object = await c.env.FINANCE_MANAGER_DOCUMENTS.get(fileObject.key);
    
    if (!object) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    // Check if user owns the file (or is admin)
    const uploadedBy = object.customMetadata?.uploadedBy;
    if (uploadedBy !== user.id && user.role !== 'ADMIN') {
      return c.json({
        success: false,
        error: 'Not authorized to process this file'
      }, 403);
    }

    // Check if file type is supported for OCR
    const mimeType = object.httpMetadata?.contentType || 'application/octet-stream';
    if (!isOCRSupported(mimeType)) {
      return c.json({
        success: false,
        error: `File type not supported for OCR: ${mimeType}`,
        supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
      }, 400);
    }

    // Check if OCR has already been processed and reprocess is not requested
    const alreadyProcessed = object.customMetadata?.ocrProcessed === 'true';
    const previouslySuccessful = object.customMetadata?.ocrSuccess === 'true';
    
    if (alreadyProcessed && previouslySuccessful && !reprocess) {
      // Return existing OCR data
      return c.json({
        success: true,
        data: {
          fileId,
          ocr: {
            processed: true,
            success: true,
            textLength: parseInt(object.customMetadata?.ocrTextLength || '0'),
            confidence: parseFloat(object.customMetadata?.ocrConfidence || '0'),
            processingTime: parseInt(object.customMetadata?.ocrProcessingTime || '0'),
            preview: object.customMetadata?.ocrText || null,
            cached: true
          }
        }
      });
    }

    // Process OCR
    const fileData = await object.arrayBuffer();
    const ocrResult = await processOCR(c.env.AI, fileData, mimeType, options);

    // Store/update OCR results in database
    try {
      const db = createDatabase(c.env.FINANCE_MANAGER_DB);
      
      // Check if document exists in database
      let rawDoc = await getRawDocByFileId(db, fileId);
      
      if (!rawDoc) {
        // Create document record if it doesn't exist
        const createDocData: CreateRawDocData = {
          fileId: fileId,
          originalName: object.customMetadata?.originalName || fileObject.key,
          mimeType: object.httpMetadata?.contentType || 'application/octet-stream',
          fileSize: fileObject.size,
          r2Key: fileObject.key,
          uploadedBy: user.id,
          description: object.customMetadata?.description,
          tags: object.customMetadata?.tags ? parseTags(object.customMetadata.tags) : [],
          entityId: user.entityId
        };

        rawDoc = await createRawDoc(db, createDocData, user.id);
      }

      // Update with OCR results
      const updateData: UpdateOCRData = {
        ocrStatus: ocrResult.success ? 'COMPLETED' : 'FAILED',
        extractedText: ocrResult.text || null,
        textLength: ocrResult.text?.length || 0,
        ocrConfidence: ocrResult.confidence,
        ocrProcessingTime: ocrResult.processingTime,
        ocrErrorMessage: ocrResult.error || null,
        ocrErrorCode: ocrResult.errorCode,
        ocrFallbackUsed: ocrResult.fallbackUsed,
        ocrRetryable: ocrResult.retryable,
        ocrMaxRetries: ocrResult.maxRetries,
        ocrProcessedAt: new Date(),
        searchableText: ocrResult.text ? generateSearchableText(ocrResult.text) : null
      };

      await updateRawDocOCR(db, fileId, updateData, user.id);

      console.log(`Updated OCR results for document ${fileId} in database`);
      
      // Also update R2 metadata for backwards compatibility
      try {
        const existingMetadata = { ...object.customMetadata };
        const updatedMetadata = {
          ...existingMetadata,
          ocrProcessed: 'true',
          ocrSuccess: ocrResult.success ? 'true' : 'false',
          ocrTextLength: ocrResult.text?.length?.toString() || '0',
          ocrConfidence: ocrResult.confidence?.toString() || '0',
          ocrProcessingTime: ocrResult.processingTime?.toString() || '0',
          ocrText: ocrResult.success && ocrResult.text ? 
            ocrResult.text.substring(0, 1000) : '',
          ocrError: ocrResult.error || '',
          ocrErrorCode: ocrResult.errorCode || '',
          ocrFallbackUsed: ocrResult.fallbackUsed ? 'true' : 'false',
          ocrRetryable: ocrResult.retryable ? 'true' : 'false',
          ocrMaxRetries: ocrResult.maxRetries?.toString() || '0',
          ocrLastProcessed: new Date().toISOString()
        };

        await c.env.FINANCE_MANAGER_DOCUMENTS.put(fileObject.key, fileData, {
          httpMetadata: object.httpMetadata,
          customMetadata: updatedMetadata
        });
      } catch (r2Error) {
        console.error('Failed to update R2 metadata:', r2Error);
        // Continue - database update was successful
      }
    } catch (dbError) {
      console.error('Failed to update OCR results in database:', dbError);
      // Fallback to R2 metadata only
      try {
        const existingMetadata = { ...object.customMetadata };
        const updatedMetadata = {
          ...existingMetadata,
          ocrProcessed: 'true',
          ocrSuccess: ocrResult.success ? 'true' : 'false',
          ocrTextLength: ocrResult.text?.length?.toString() || '0',
          ocrConfidence: ocrResult.confidence?.toString() || '0',
          ocrProcessingTime: ocrResult.processingTime?.toString() || '0',
          ocrText: ocrResult.success && ocrResult.text ? 
            ocrResult.text.substring(0, 1000) : '',
          ocrError: ocrResult.error || '',
          ocrLastProcessed: new Date().toISOString()
        };

        await c.env.FINANCE_MANAGER_DOCUMENTS.put(fileObject.key, fileData, {
          httpMetadata: object.httpMetadata,
          customMetadata: updatedMetadata
        });
      } catch (error) {
        console.error('Failed to update both database and R2 metadata:', error);
      }
    }

    return c.json({
      success: true,
      data: {
        fileId,
        ocr: {
          processed: true,
          success: ocrResult.success,
          textLength: ocrResult.text?.length || 0,
          confidence: ocrResult.confidence,
          processingTime: ocrResult.processingTime,
          preview: ocrResult.success && ocrResult.text ? 
            ocrResult.text.substring(0, 200) + (ocrResult.text.length > 200 ? '...' : '') : 
            null,
          error: ocrResult.error,
          cached: false
        }
      }
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    return c.json({
      success: false,
      error: 'Internal server error during OCR processing'
    }, 500);
  }
});

/**
 * @swagger
 * /api/uploads/{fileId}/ocr:
 *   get:
 *     summary: Get OCR results for a file
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *       - in: query
 *         name: full
 *         schema:
 *           type: boolean
 *         description: Return full OCR text instead of preview
 *     responses:
 *       200:
 *         description: OCR results
 *       404:
 *         description: File not found or OCR not processed
 */
uploads.get('/:fileId/ocr', async (c) => {
  try {
    const user = c.get('user');
    const fileId = c.req.param('fileId');
    const fullText = c.req.query('full') === 'true';

    if (!fileId) {
      return c.json({
        success: false,
        error: 'File ID required'
      }, 400);
    }

    // Find the file
    const objects = await c.env.FINANCE_MANAGER_DOCUMENTS.list({
      prefix: fileId
    });

    const fileObject = objects.objects.find(obj => obj.key.startsWith(fileId));
    
    if (!fileObject) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    // Get file metadata
    const object = await c.env.FINANCE_MANAGER_DOCUMENTS.get(fileObject.key);
    
    if (!object) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    // Check access permissions
    const uploadedBy = object.customMetadata?.uploadedBy;
    if (uploadedBy !== user.id && user.role !== 'ADMIN') {
      return c.json({
        success: false,
        error: 'Not authorized to access this file'
      }, 403);
    }

    // Check if OCR has been processed
    const ocrProcessed = object.customMetadata?.ocrProcessed === 'true';
    
    if (!ocrProcessed) {
      return c.json({
        success: false,
        error: 'OCR has not been processed for this file',
        suggestion: 'Use POST /api/uploads/{fileId}/ocr to process OCR first'
      }, 404);
    }

    const ocrSuccess = object.customMetadata?.ocrSuccess === 'true';
    
    // Prepare OCR response
    const ocrData = {
      processed: true,
      success: ocrSuccess,
      textLength: parseInt(object.customMetadata?.ocrTextLength || '0'),
      confidence: parseFloat(object.customMetadata?.ocrConfidence || '0'),
      processingTime: parseInt(object.customMetadata?.ocrProcessingTime || '0'),
      lastProcessed: object.customMetadata?.ocrLastProcessed,
      error: object.customMetadata?.ocrError || undefined
    };

    // Add text data if successful
    if (ocrSuccess) {
      if (fullText) {
        // For full text, we need to reprocess or store it separately
        // For now, return the stored preview with a notice
        ocrData.text = object.customMetadata?.ocrText || '';
        ocrData.note = 'This is a preview of the OCR text (max 1000 chars). Full text requires reprocessing.';
      } else {
        ocrData.preview = object.customMetadata?.ocrText || '';
      }
    }

    return c.json({
      success: true,
      data: {
        fileId,
        originalName: object.customMetadata?.originalName,
        mimeType: object.httpMetadata?.contentType,
        ocr: ocrData
      }
    });

  } catch (error) {
    console.error('Get OCR error:', error);
    return c.json({
      success: false,
      error: 'Internal server error while getting OCR results'
    }, 500);
  }
});

/**
 * @swagger
 * /api/uploads/stats:
 *   get:
 *     summary: Get upload statistics
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upload statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
uploads.get('/stats', async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
    const stats = await getUploadStats(db, user.id);

    if (!stats.success) {
      return c.json({
        error: 'Failed to get upload statistics',
        details: stats.error
      }, 500);
    }

    return c.json({
      success: true,
      data: stats.data
    });
  } catch (error) {
    console.error('Upload stats error:', error);
    return c.json({
      error: 'Failed to get upload statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * @swagger
 * /api/uploads/search:
 *   post:
 *     summary: Semantic search for documents
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Maximum number of results
 *               threshold:
 *                 type: number
 *                 default: 0.7
 *                 description: Similarity threshold
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
uploads.post('/search', async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { query, limit = 10, threshold = 0.7 } = await c.req.json();

    if (!query || typeof query !== 'string') {
      return c.json({ error: 'Search query is required' }, 400);
    }

    // Perform semantic search using Vectorize
    const searchResults = await c.env.DOCUMENT_EMBEDDINGS.query(query, {
      topK: limit,
      returnMetadata: true,
      filter: {
        // Add any additional filters here if needed
      }
    });

    // Filter results by similarity threshold
    const filteredResults = searchResults.matches.filter(
      match => match.score >= threshold
    );

    // Get document details from database for matching file IDs
    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
    const fileIds = filteredResults.map(match => match.id);
    
    const documents = [];
    for (const fileId of fileIds) {
      const docResult = await getRawDocByFileId(db, fileId);
      if (docResult.success && docResult.data) {
        const match = filteredResults.find(m => m.id === fileId);
        documents.push({
          ...docResult.data,
          similarity: match?.score || 0,
          matchedText: match?.metadata?.text || ''
        });
      }
    }

    return c.json({
      success: true,
      data: {
        query,
        results: documents,
        totalMatches: filteredResults.length,
        threshold
      }
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    return c.json({
      error: 'Failed to perform semantic search',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default uploads;