/**
 * Vectorize API Routes
 * Handles document vectorization and semantic search
 */

import { Hono } from 'hono'
import type { D1Database, KVNamespace, R2Bucket, Vectorize, Ai } from '@cloudflare/workers-types'

import { authMiddleware, getCurrentUser } from '../../middleware/auth';
import { createVectorizeService } from '@finance-manager/ai';
import { createDatabase } from '@finance-manager/db';
import { getRawDocByFileId } from '../../utils/raw-docs';
import { ValidationError } from '../../utils/logger';

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

const vectorize = new Hono<{ Bindings: Env }>()

vectorize.use('/*', authMiddleware);

// Helper function to create vectorize service
function createVectorizeServiceInstance(vectorizeBinding: Vectorize, aiBinding: Ai) {
  return createVectorizeService({
    vectorize: vectorizeBinding,
    ai: aiBinding,
    embeddingModel: '@cf/baai/bge-base-en-v1.5',
  });
}

/**
 * @swagger
 * /api/vectorize/search:
 *   post:
 *     summary: Perform semantic search across documents
 *     tags: [Vectorize]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query text
 *               topK:
 *                 type: integer
 *                 default: 10
 *                 description: Maximum number of results
 *               threshold:
 *                 type: number
 *                 default: 0.7
 *                 description: Similarity threshold (0-1)
 *               filter:
 *                 type: object
 *                 description: Additional metadata filters
 *               includeChunks:
 *                 type: boolean
 *                 default: false
 *                 description: Include chunk information in results
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
 *                   properties:
 *                     query:
 *                       type: string
 *                     results:
 *                       type: array
 *                     totalMatches:
 *                       type: integer
 *                     threshold:
 *                       type: number
 *                     processingTime:
 *                       type: number
 */
vectorize.post('/search', async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { 
      query, 
      topK = 10, 
      threshold = 0.7, 
      filter = {}, 
      includeChunks = false 
    } = await c.req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new ValidationError('Search query is required and must be a non-empty string');
    }

    if (topK < 1 || topK > 100) {
      throw new ValidationError('topK must be between 1 and 100');
    }

    if (threshold < 0 || threshold > 1) {
      throw new ValidationError('threshold must be between 0 and 1');
    }

    // Create vectorize service and perform semantic search
    const vectorizeService = createVectorizeServiceInstance(c.env.DOCUMENT_EMBEDDINGS, c.env.AI);
    const searchResponse = await vectorizeService.searchByText(query, {
      topK,
      threshold,
      filter: {
        userId: user.id, // Only search user's documents
        ...filter
      },
      returnMetadata: true
    });

    // Get document details from database
    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
    const documents = [];
    const processedFileIds = new Set();
    
    for (const match of searchResponse.matches) {
      // Extract file ID from match ID (handle both direct fileId and chunk IDs)
      const fileId = match.id.includes('_chunk_') ? match.id.split('_chunk_')[0] : match.id;
      
      // If not including chunks, only process each file once (use highest scoring chunk)
      if (!includeChunks && processedFileIds.has(fileId)) {
        continue;
      }
      
      const docResult = await getRawDocByFileId(db, fileId);
      if (docResult.success === true && docResult.doc) {
        const documentData: any = {
          ...docResult.doc,
          similarity: match.score,
          matchedText: match.metadata?.text || ''
        };

        // Add chunk information if requested
        if (includeChunks) {
          documentData.chunkInfo = {
            chunkIndex: match.metadata?.chunkIndex,
            totalChunks: match.metadata?.totalChunks,
            chunkId: match.id
          };
        }

        documents.push(documentData);
        processedFileIds.add(fileId);
      }
    }

    return c.json({
      success: true,
      data: {
        query: searchResponse.query,
        results: documents,
        totalMatches: searchResponse.totalMatches,
        threshold: searchResponse.threshold,
        processingTime: searchResponse.processingTime,
        includeChunks
      }
    });
  } catch (error) {
    console.error('Vector search error:', error);
    
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({
      error: 'Failed to perform semantic search',
      details: errorMessage
    }, 500);
  }
});

/**
 * @swagger
 * /api/vectorize/embed:
 *   post:
 *     summary: Generate embeddings for text content
 *     tags: [Vectorize]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileId
 *               - text
 *             properties:
 *               fileId:
 *                 type: string
 *                 description: Unique file identifier
 *               text:
 *                 type: string
 *                 description: Text content to embed
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       200:
 *         description: Embedding generation result
 */
vectorize.post('/embed', async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { fileId, text, metadata = {} } = await c.req.json();

    if (!fileId || typeof fileId !== 'string') {
      throw new ValidationError('fileId is required and must be a string');
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new ValidationError('text is required and must be a non-empty string');
    }

    // Create vectorize service and generate embeddings
    const vectorizeService = createVectorizeServiceInstance(c.env.DOCUMENT_EMBEDDINGS, c.env.AI);
    const result = await vectorizeService.embedDocument(fileId, text, {
      userId: user.id,
      ...metadata
    });

    return c.json({
      success: result.success === true,
      data: {
        fileId,
        chunksCreated: result.chunksCreated,
        textLength: text.length
      },
      error: result.error
    });
  } catch (error) {
    console.error('Embedding generation error:', error);
    
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({
      error: 'Failed to generate embeddings',
      details: errorMessage
    }, 500);
  }
});

/**
 * @swagger
 * /api/vectorize/document/{fileId}:
 *   get:
 *     summary: Get embeddings for a specific document
 *     tags: [Vectorize]
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
 *         description: Document embeddings
 */
vectorize.get('/document/:fileId', async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const fileId = c.req.param('fileId');
    if (!fileId) {
      throw new ValidationError('fileId parameter is required');
    }

    // Verify user owns the document
    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
    const docResult = await getRawDocByFileId(db, fileId);
    
    if (docResult.success === false || !docResult.doc) {
      return c.json({ error: 'Document not found' }, 404);
    }

    if (docResult.doc.uploadedBy !== user.id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get document embeddings
    const vectorizeService = createVectorizeServiceInstance(c.env.DOCUMENT_EMBEDDINGS, c.env.AI);
    const embeddings = await vectorizeService.getDocumentEmbeddings(fileId);

    return c.json({
      success: true,
      data: {
        fileId,
        embeddings: embeddings.map(embedding => ({
          id: embedding.id,
          score: embedding.score,
          metadata: embedding.metadata
        })),
        totalChunks: embeddings.length
      }
    });
  } catch (error) {
    console.error('Get document embeddings error:', error);
    
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({
      error: 'Failed to get document embeddings',
      details: errorMessage
    }, 500);
  }
});

/**
 * @swagger
 * /api/vectorize/document/{fileId}:
 *   delete:
 *     summary: Delete embeddings for a specific document
 *     tags: [Vectorize]
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
 *         description: Deletion result
 */
vectorize.delete('/document/:fileId', async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const fileId = c.req.param('fileId');
    if (!fileId) {
      throw new ValidationError('fileId parameter is required');
    }

    // Verify user owns the document
    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
    const docResult = await getRawDocByFileId(db, fileId);
    
    if (docResult.success === false || !docResult.doc) {
      return c.json({ error: 'Document not found' }, 404);
    }

    if (docResult.doc.uploadedBy !== user.id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Delete document embeddings
    const vectorizeService = createVectorizeServiceInstance(c.env.DOCUMENT_EMBEDDINGS, c.env.AI);
    const result = await vectorizeService.deleteDocument(fileId);

    return c.json({
      success: result.success === true,
      data: {
        fileId,
        deleted: result.success === true
      },
      error: result.error
    });
  } catch (error) {
    console.error('Delete document embeddings error:', error);
    
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({
      error: 'Failed to delete document embeddings',
      details: errorMessage
    }, 500);
  }
});

/**
 * @swagger
 * /api/vectorize/stats:
 *   get:
 *     summary: Get vectorize service statistics
 *     tags: [Vectorize]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service statistics
 */
vectorize.get('/stats', async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const vectorizeService = createVectorizeServiceInstance(c.env.DOCUMENT_EMBEDDINGS, c.env.AI);
    const stats = await vectorizeService.getStats();

    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get vectorize stats error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({
      error: 'Failed to get vectorize statistics',
      details: errorMessage
    }, 500);
  }
});

export default vectorize;