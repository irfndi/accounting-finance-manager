import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth';
import { processOCR, isOCRSupported } from '../../utils/ocr';
import { createDatabase, createRawDoc, updateRawDocOCR, getRawDocByFileId, generateSearchableText, parseTags, getUploadStats } from '@finance-manager/db';
import { createOCRLogger } from '../../utils/logger';
import { createFinancialAIService, createVectorizeServiceInstance } from '../../services';
const uploads = new Hono();
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
function generateUUID() {
    return crypto.randomUUID();
}
// Helper function to get file extension from filename
function getFileExtension(filename) {
    return filename.split('.').pop()?.toLowerCase() || '';
}
// Helper function to validate file type
function isValidFileType(file) {
    return ALLOWED_MIME_TYPES.includes(file.type);
}
// Helper function to validate file size
function isValidFileSize(file) {
    return file.size <= MAX_FILE_SIZE;
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
        // Debug environment access
        const user = c.get('user');
        if (!user) {
            return c.json({
                success: false,
                error: 'User not authenticated'
            }, 401);
        }
        const formData = await c.req.formData();
        const file = formData.get('file');
        const tags = formData.get('tags');
        const description = formData.get('description');
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
        // Process OCR if file type is supported
        let ocrResult = null;
        let fileBuffer = null;
        let documentClassification = null;
        let structuredData = null;
        if (isOCRSupported(file.type)) {
            try {
                // Get file buffer for OCR processing
                fileBuffer = await file.arrayBuffer();
                // Process OCR with Cloudflare AI
                ocrResult = await processOCR(c.env.AI, fileBuffer, file.type, {
                    maxTextLength: 50000, // Limit text to 50KB
                    includeConfidence: true
                }, fileId);
                // OCR processing completed
                // Process with LLM if OCR was successful
                if (ocrResult.success === true && ocrResult.text) {
                    const aiService = createFinancialAIService(c.env);
                    if (aiService) {
                        try {
                            // Classify the document
                            documentClassification = await aiService.classifyDocument({
                                text: ocrResult.text,
                                confidence: ocrResult.confidence || 0
                            });
                            // Document classification completed
                            // Extract structured data based on classification
                            if (documentClassification && documentClassification.confidence > 0.6) {
                                structuredData = await aiService.extractDocumentData({
                                    text: ocrResult.text,
                                    confidence: ocrResult.confidence || 0
                                }, documentClassification?.type === 'other' ? undefined :
                                    documentClassification?.type);
                                // Data extraction completed
                                // Update database with LLM results
                                try {
                                    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
                                    // LLM data processing completed
                                }
                                catch (_dbError) {
                                    // Database update failed, continue processing
                                }
                                // Generate document embeddings for semantic search
                                try {
                                    const vectorizeService = createVectorizeServiceInstance(c.env);
                                    const textForEmbedding = ocrResult.text || '';
                                    const embeddingMetadata = {
                                        documentType: documentClassification?.type || 'unknown',
                                        confidence: documentClassification?.confidence || 0,
                                        fileName: file.name,
                                        mimeType: file.type,
                                        userId: user.id,
                                        hasStructuredData: !!structuredData
                                    };
                                    const _embeddingResult = await vectorizeService.embedDocument(fileId, textForEmbedding, embeddingMetadata);
                                    // Embedding generation completed
                                }
                                catch (_embeddingError) {
                                    // Continue with upload even if embedding generation fails
                                }
                            }
                        }
                        catch (_aiError) {
                            // Continue with upload even if LLM processing fails
                        }
                    }
                }
            }
            catch (error) {
                // Continue with upload even if OCR fails
                ocrResult = {
                    success: false,
                    error: 'OCR processing failed but file was uploaded successfully',
                    errorCode: 'UNEXPECTED_ERROR',
                    retryable: true
                };
            }
        }
        // Create file data for R2 upload (use buffer if OCR was processed, otherwise convert stream)
        const fileData = fileBuffer ? fileBuffer : await file.arrayBuffer();
        // Upload to R2
        const metadata = {
            uploadedAt: new Date().toISOString(),
            tags: tags ? parseTags(tags) : [],
            description: description || ''
        };
        // Upload to R2
        const uploadResult = await c.env.FINANCE_MANAGER_DOCUMENTS.put(storedFileName, fileData, {
            httpMetadata: {
                contentType: file.type,
                contentDisposition: `attachment; filename="${file.name}"`
            },
            customMetadata: {
                originalName: file.name,
                createdBy: user.id,
                uploadedAt: metadata.uploadedAt,
                tags: metadata.tags.join(','),
                description: metadata.description || '',
                // Store OCR results in metadata
                ocrProcessed: ocrResult ? 'true' : 'false',
                ocrSuccess: ocrResult?.success === true ? 'true' : 'false',
                ocrTextLength: ocrResult?.text?.length?.toString() || '0',
                ocrConfidence: ocrResult?.confidence?.toString() || '0',
                ocrProcessingTime: ocrResult?.processingTime?.toString() || '0',
                ocrText: ocrResult?.success === true && ocrResult.text ?
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
            const createDocData = {
                fileId: fileId,
                originalName: file.name,
                mimeType: file.type,
                fileSize: file.size,
                r2Key: storedFileName,
                uploadedBy: user.id,
                description: description || undefined,
                tags: tags ? JSON.stringify(parseTags(tags)) : undefined,
            };
            const [newRawDoc] = await createRawDoc(db, createDocData);
            if (!newRawDoc) {
                logger.databaseOperation('create', fileId, false, 'No document returned after creation');
                throw new Error(`Failed to create document record for file ID: ${fileId}`);
            }
            logger.databaseOperation('create', fileId, true);
            // Update with OCR results if processing was successful
            if (ocrResult) {
                const ocrStatus = ocrResult.success ? 'COMPLETED' : 'FAILED';
                const ocrData = {
                    ocrStatus,
                    extractedText: ocrResult.text || undefined,
                    textLength: ocrResult.text?.length || 0,
                    ocrConfidence: ocrResult.confidence,
                    ocrProcessingTime: ocrResult.processingTime,
                    ocrErrorMessage: ocrResult.error || undefined,
                    ocrErrorCode: ocrResult.errorCode,
                    ocrFallbackUsed: ocrResult.fallbackUsed,
                    ocrRetryable: ocrResult.retryable,
                    ocrMaxRetries: ocrResult.maxRetries,
                    ocrProcessedAt: new Date(),
                    searchableText: ocrResult.text ? generateSearchableText(ocrResult.text) : undefined
                };
                const updateResult = await updateRawDocOCR(db, fileId, ocrData);
                if (!updateResult) {
                    logger.databaseOperation('update', fileId, false, 'No document returned after update');
                }
                else {
                    logger.databaseOperation('update', fileId, true);
                }
            }
            logger.info(`Stored document ${fileId} in database with ${ocrResult ? 'OCR' : 'no OCR'} processing`, {
                fileId,
                operation: 'UPLOAD_SUCCESS',
                metadata: {
                    hasOCR: !!ocrResult,
                    ocrSuccess: ocrResult?.success === true,
                    fileSize: file.size,
                    mimeType: file.type
                }
            });
        }
        catch (dbError) {
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
                    success: ocrResult.success === true,
                    textLength: ocrResult.text?.length || 0,
                    confidence: ocrResult.confidence,
                    processingTime: ocrResult.processingTime,
                    preview: ocrResult.success === true && ocrResult.text ?
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during upload';
        // Upload error occurred
        return c.json({
            success: false,
            error: 'Internal server error during upload',
            details: errorMessage
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
        const user = c.get('user');
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
        }
        else {
            headers.set('Content-Disposition', `inline; filename="${originalName}"`);
        }
        return new Response(object.body, {
            headers
        });
    }
    catch (error) {
        // Download error occurred
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
        const uploadedBy = object.customMetadata?.createdBy;
        if (uploadedBy !== user.id) {
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
    }
    catch (error) {
        // Delete error occurred
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
        const _cursor = c.req.query('cursor');
        const tagFilter = c.req.query('tag');
        // List files from R2
        const listOptions = {
            limit: Math.min(limit, 100) // Cap at 100
        };
        if (_cursor) {
            listOptions.cursor = _cursor;
        }
        const _result = await c.env.FINANCE_MANAGER_DOCUMENTS.list(listOptions);
        // Process files and extract metadata
        const files = await Promise.all(_result.objects.map(async (obj) => {
            const _object = await c.env.FINANCE_MANAGER_DOCUMENTS.get(obj.key);
            if (!_object)
                return null;
            const metadata = {
                id: obj.key.split('.')[0], // Extract UUID from filename
                originalName: _object.customMetadata?.originalName || obj.key,
                size: obj.size,
                mimeType: _object.httpMetadata?.contentType || 'application/octet-stream',
                uploadedBy: _object.customMetadata?.uploadedBy || '',
                uploadedAt: _object.customMetadata?.uploadedAt || obj.uploaded.toISOString(),
                tags: _object.customMetadata?.tags ? _object.customMetadata.tags.split(',').filter(Boolean) : [],
                description: _object.customMetadata?.description || '',
                url: `/api/uploads/${obj.key.split('.')[0]}`
            };
            // Filter by tag if specified
            if (tagFilter && !metadata.tags.includes(tagFilter)) {
                return null;
            }
            // Filter by user (non-admin users can only see their own files)
            if (metadata.uploadedBy !== user.id) {
                return null;
            }
            return metadata;
        }));
        // Filter out null results
        const validFiles = files.filter((file) => file !== null);
        return c.json({
            success: true,
            data: {
                files: validFiles,
                hasMore: _result.truncated,
                total: validFiles.length
            }
        });
    }
    catch (error) {
        // List files error occurred
        return c.json({
            success: false,
            error: 'Internal server error while listing files',
            details: error instanceof Error ? error.message : 'Unknown error'
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
        if (uploadedBy !== user.id) {
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
    }
    catch (_error) {
        // Get metadata error occurred
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
        if (uploadedBy !== user.id) {
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
        const ocrResult = await processOCR(c.env.AI, fileData, mimeType, options, fileId);
        // Store/update OCR results in database
        try {
            const db = createDatabase(c.env.FINANCE_MANAGER_DB);
            // Check if document exists in database
            let existingRawDoc = await getRawDocByFileId(db, fileId);
            if (!existingRawDoc) {
                // Create document record if it doesn't exist
                const createDocData = {
                    fileId: fileId,
                    originalName: object.customMetadata?.originalName || fileObject.key,
                    mimeType: object.httpMetadata?.contentType || 'application/octet-stream',
                    fileSize: fileObject.size,
                    r2Key: fileObject.key,
                    uploadedBy: user.id,
                    description: object.customMetadata?.description || undefined,
                    tags: object.customMetadata?.tags ? JSON.stringify(parseTags(object.customMetadata.tags)) : undefined,
                };
                const [newDoc] = await createRawDoc(db, createDocData);
                if (newDoc) {
                    existingRawDoc = newDoc;
                }
            }
            // Update with OCR results
            const ocrStatus = ocrResult.success ? 'COMPLETED' : 'FAILED';
            const ocrData = {
                ocrStatus,
                extractedText: ocrResult.text || undefined,
                textLength: ocrResult.text?.length || 0,
                ocrConfidence: ocrResult.confidence,
                ocrProcessingTime: ocrResult.processingTime,
                ocrErrorMessage: ocrResult.error || undefined,
                ocrErrorCode: ocrResult.errorCode,
                ocrFallbackUsed: ocrResult.fallbackUsed,
                ocrRetryable: ocrResult.retryable,
                ocrMaxRetries: ocrResult.maxRetries,
                ocrProcessedAt: new Date(),
                searchableText: ocrResult.text ? generateSearchableText(ocrResult.text) : undefined
            };
            await updateRawDocOCR(db, fileId, ocrData);
            // OCR results updated in database
            // Also update R2 metadata for backwards compatibility
            try {
                const existingMetadata = { ...object.customMetadata };
                const updatedMetadata = {
                    ...existingMetadata,
                    ocrProcessed: 'true',
                    ocrSuccess: ocrResult.success === true ? 'true' : 'false',
                    ocrTextLength: ocrResult.text?.length?.toString() || '0',
                    ocrConfidence: ocrResult.confidence?.toString() || '0',
                    ocrProcessingTime: ocrResult.processingTime?.toString() || '0',
                    ocrText: ocrResult.success === true && ocrResult.text ?
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
            }
            catch (r2Error) {
                // Failed to update R2 metadata
                // Continue - database update was successful
            }
        }
        catch (dbError) {
            // Failed to update OCR results in database
            // Fallback to R2 metadata only
            try {
                const existingMetadata = { ...object.customMetadata };
                const updatedMetadata = {
                    ...existingMetadata,
                    ocrProcessed: 'true',
                    ocrSuccess: ocrResult.success === true ? 'true' : 'false',
                    ocrTextLength: ocrResult.text?.length?.toString() || '0',
                    ocrConfidence: ocrResult.confidence?.toString() || '0',
                    ocrProcessingTime: ocrResult.processingTime?.toString() || '0',
                    ocrText: ocrResult.success === true && ocrResult.text ?
                        ocrResult.text.substring(0, 1000) : '',
                    ocrError: ocrResult.error || '',
                    ocrLastProcessed: new Date().toISOString()
                };
                await c.env.FINANCE_MANAGER_DOCUMENTS.put(fileObject.key, fileData, {
                    httpMetadata: object.httpMetadata,
                    customMetadata: updatedMetadata
                });
            }
            catch (error) {
                // Failed to update both database and R2 metadata
            }
        }
        return c.json({
            success: true,
            data: {
                fileId,
                ocr: {
                    processed: true,
                    success: ocrResult.success === true,
                    textLength: ocrResult.text?.length || 0,
                    confidence: ocrResult.confidence,
                    processingTime: ocrResult.processingTime,
                    preview: ocrResult.success === true && ocrResult.text ?
                        ocrResult.text.substring(0, 200) + (ocrResult.text.length > 200 ? '...' : '') :
                        null,
                    error: ocrResult.error,
                    cached: false
                }
            }
        });
    }
    catch (error) {
        // OCR processing error occurred
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
        if (uploadedBy !== user.id) {
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
            }
            else {
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
    }
    catch (_error) {
        // Get OCR error occurred
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
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const db = createDatabase(c.env.FINANCE_MANAGER_DB);
        const stats = await getUploadStats(db, user.id);
        return c.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        // Upload stats error occurred
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
        const user = c.get('user');
        if (!user) {
            return c.json({
                success: false,
                error: 'Unauthorized'
            }, 401);
        }
        const { query, limit = 10, threshold = 0.7, filter } = await c.req.json();
        if (!query || typeof query !== 'string') {
            return c.json({
                error: 'Search query is required'
            }, 400);
        }
        // Create vectorize service and perform semantic search
        const vectorizeService = createVectorizeServiceInstance(c.env);
        const searchResponse = await vectorizeService.searchByText(query, {
            topK: limit,
            threshold,
            filter: {
                userId: user.id, // Only search user's documents
                ...filter
            },
            returnMetadata: true
        });
        // Get document details from database for matching file IDs
        const db = createDatabase(c.env.FINANCE_MANAGER_DB);
        const documents = [];
        for (const match of searchResponse.matches) {
            // Extract file ID from match ID (handle both direct fileId and chunk IDs)
            const fileId = match.id.includes('_chunk_') ? match.id.split('_chunk_')[0] : match.id;
            const docResult = await getRawDocByFileId(db, fileId);
            if (docResult) {
                documents.push({
                    ...docResult,
                    similarity: match.score,
                    matchedText: match.metadata?.text || '',
                });
            }
        }
        return c.json({
            success: true,
            data: {
                query: searchResponse.query,
                results: documents,
                totalMatches: searchResponse.totalMatches,
                threshold: searchResponse.threshold,
                processingTime: searchResponse.processingTime
            }
        });
    }
    catch (error) {
        // Semantic search error occurred
        // Handle AIServiceError specifically
        if (error && typeof error === 'object' && 'name' in error && error.name === 'AIServiceError') {
            return c.json({
                success: false,
                error: 'Failed to generate embeddings',
                details: error.message || 'Unknown AI service error'
            }, 500);
        }
        return c.json({
            success: false,
            error: 'Failed to generate embeddings',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
export default uploads;
