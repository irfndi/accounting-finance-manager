/**
 * Vectorize API Routes
 * Handles document vectorization and semantic search
 */

import { Hono, type Context, type Next } from 'hono';

import { type AppContext, type SearchResultDocument } from '../../types';
import { authMiddleware } from '../../middleware/auth';
import { createVectorizeServiceInstance } from '../../services';
import { createDatabase, getRawDocByFileId } from '@finance-manager/db';
import { ValidationError } from '../../utils/logger';

const vectorize = new Hono<AppContext>();

const docOwnershipMiddleware = async (c: Context<AppContext>, next: Next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const fileId = c.req.param('fileId');
  if (!fileId) {
    throw new ValidationError('fileId parameter is required');
  }

  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const doc = await getRawDocByFileId(db, fileId);

  if (!doc) {
    return c.json({ error: 'Document not found' }, 404);
  }

  if (doc.createdBy !== user.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  c.set('doc', doc);
  await next();
};

vectorize.use('/*', authMiddleware);
vectorize.use('/document/:fileId', docOwnershipMiddleware);



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
vectorize.post('/search', async (c: Context<AppContext>) => {
  try {
    const user = c.get('user');
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

    const vectorizeService = createVectorizeServiceInstance(c.env);
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
    const documents: SearchResultDocument[] = [];
    const processedFileIds = new Set();
    
    for (const match of searchResponse.matches) {
      // Extract file ID from match ID (handle both direct fileId and chunk IDs)
      const fileId = match.id.includes('_chunk_') ? match.id.split('_chunk_')[0] : match.id;
      
      // If not including chunks, only process each file once (use highest scoring chunk)
      if (!includeChunks && processedFileIds.has(fileId)) {
        continue;
      }
      
      const doc = await getRawDocByFileId(db, fileId);
      if (doc) {
        const documentData: SearchResultDocument = {
          ...doc,
          similarity: match.score,
          matchedText: match.metadata?.text || ''
        };

        // Add chunk information if requested
        if (includeChunks) {
          documentData.chunkInfo = {
            chunkIndex: match.metadata?.chunkIndex ?? 0,
            totalChunks: match.metadata?.totalChunks ?? 0,
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
    // Vector search error occurred
    
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
vectorize.post('/embed', async (c: Context<AppContext>) => {
  try {
    const user = c.get('user');
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

    const vectorizeService = createVectorizeServiceInstance(c.env);
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
    // Embedding generation error occurred
    
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
vectorize.get('/document/:fileId', async (c: Context<AppContext>) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const fileId = c.req.param('fileId');
    const _doc = c.get('doc');

    const vectorizeService = createVectorizeServiceInstance(c.env);
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
    // Get document embeddings error occurred
    
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
vectorize.delete('/document/:fileId', async (c: Context<AppContext>) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const fileId = c.req.param('fileId');
    const _doc = c.get('doc');

    const vectorizeService = createVectorizeServiceInstance(c.env);
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
    // Delete document embeddings error occurred
    
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
vectorize.get('/stats', async (c: Context<AppContext>) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const vectorizeService = createVectorizeServiceInstance(c.env);
    const stats = await vectorizeService.getStats();

    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    // Get vectorize stats error occurred
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({
      error: 'Failed to get vectorize statistics',
      details: errorMessage
    }, 500);
  }
});

export default vectorize;