/**
 * Tests for Vectorize Service
 * Comprehensive test coverage for document embeddings and semantic search
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VectorizeService, type VectorizeConfig, type EmbeddingMetadata, type SearchOptions, type SearchResult } from '../../src/ai/services/vectorize-service.js';
import { AIServiceError } from '../../src/ai/types.js';

// Mock Cloudflare Vectorize
const mockVectorize = {
  insert: vi.fn(),
  query: vi.fn(),
  deleteByIds: vi.fn(),
  describe: vi.fn(),
  queryById: vi.fn(),
  upsert: vi.fn(),
  getByIds: vi.fn()
};

// Mock Cloudflare AI
const mockAi = {
  run: vi.fn(),
  aiGatewayLogId: 'mock-log-id',
  gateway: vi.fn(),
  autorag: vi.fn(),
  models: {},
  toMarkdown: vi.fn()
} as any;

describe.skip('VectorizeService', () => {
  let vectorizeService: VectorizeService;
  let mockConfig: VectorizeConfig;

  const mockDocument = {
    fileId: 'doc-123',
    text: 'This is a financial document about office expenses and supplies.',
    metadata: {
      mimeType: 'application/pdf',
      fileName: 'invoice.pdf',
      userId: 'user-456',
      tags: ['invoice', 'office_expenses']
    }
  };

  const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());

  beforeEach(() => {
    mockConfig = {
      vectorize: mockVectorize,
      ai: mockAi,
      embeddingModel: '@cf/baai/bge-base-en-v1.5',
      maxTextLength: 8000,
      chunkSize: 1000,
      chunkOverlap: 200
    };

    vectorizeService = new VectorizeService(mockConfig);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(vectorizeService).toBeDefined();
      // Check private properties are set correctly
      expect(vectorizeService['vectorize']).toEqual(mockVectorize);
      expect(vectorizeService['ai']).toEqual(mockAi);
      expect(vectorizeService['embeddingModel']).toEqual('@cf/baai/bge-base-en-v1.5');
    });

    it('should use default values when not provided in config', () => {
      const minimalConfig = {
        vectorize: mockVectorize
      };
      const defaultService = new VectorizeService(minimalConfig);
      expect(defaultService).toBeDefined();
      expect(defaultService['embeddingModel']).toEqual('@cf/baai/bge-base-en-v1.5');
      expect(defaultService['maxTextLength']).toEqual(8000);
    });
  });

  describe('embedDocument', () => {
    it('should generate embeddings and store in vectorize', async () => {
      // Mock AI embedding response
      mockAi.run.mockResolvedValue({
        shape: [1, 1536],
        data: [mockEmbedding]
      });

      // Mock vectorize insert response
      mockVectorize.insert.mockResolvedValue({
        count: 1,
        ids: ['doc-123']
      });

      const result = await vectorizeService.embedDocument(
        mockDocument.fileId,
        mockDocument.text,
        mockDocument.metadata
      );

      expect(result).toEqual({
        success: true,
        chunksCreated: 1
      });

      // Verify AI was called to generate embeddings
      expect(mockAi.run).toHaveBeenCalledWith('@cf/baai/bge-base-en-v1.5', {
        text: [mockDocument.text]
      });

      // Verify vectorize was called to insert the embedding
      expect(mockVectorize.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          id: mockDocument.fileId,
          values: mockEmbedding,
          metadata: expect.objectContaining({
            fileId: mockDocument.fileId,
            text: mockDocument.text.substring(0, 1000),
            ...mockDocument.metadata
          })
        })
      ]);
    });

    it('should handle empty text input', async () => {
      const result = await vectorizeService.embedDocument('doc-123', '', {});
      
      expect(result).toEqual({
        success: false,
        chunksCreated: 0,
        error: 'No text content to embed'
      });
      
      expect(mockAi.run).not.toHaveBeenCalled();
      expect(mockVectorize.insert).not.toHaveBeenCalled();
    });

    it('should handle AI embedding errors', async () => {
      mockAi.run.mockRejectedValue(new Error('Embedding generation failed'));

      const result = await vectorizeService.embedDocument(
        mockDocument.fileId,
        mockDocument.text,
        mockDocument.metadata
      );

      expect(result).toEqual({
        success: false,
        chunksCreated: 0,
        error: 'Embedding generation failed'
      });
    });

    it('should handle missing AI binding', async () => {
      // Create service without AI binding
      const serviceWithoutAi = new VectorizeService({
        vectorize: mockVectorize
      });

      const result = await serviceWithoutAi.embedDocument(
        mockDocument.fileId,
        mockDocument.text
      );

      expect(result).toEqual({
        success: false,
        chunksCreated: 0,
        error: 'AI binding is required for embedding generation'
      });
    });

    it('should handle long text by splitting into chunks', async () => {
      // Create long text that will be split into multiple chunks
      const longText = 'A'.repeat(2500);
      
      // Mock AI embedding responses for each chunk
      mockAi.run.mockResolvedValueOnce({
        shape: [1, 1536],
        data: [mockEmbedding]
      }).mockResolvedValueOnce({
        shape: [1, 1536],
        data: [mockEmbedding]
      }).mockResolvedValueOnce({
        shape: [1, 1536],
        data: [mockEmbedding]
      });

      mockVectorize.insert.mockResolvedValue({
        count: 3,
        ids: ['doc-123_chunk_0', 'doc-123_chunk_1', 'doc-123_chunk_2']
      });

      const result = await vectorizeService.embedDocument('doc-123', longText);

      expect(result).toEqual({
        success: true,
        chunksCreated: 3
      });

      // Should have called AI.run multiple times for each chunk
      expect(mockAi.run).toHaveBeenCalledTimes(3);
      
      // Should have inserted vectors with chunk IDs
      expect(mockVectorize.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'doc-123_chunk_0' }),
          expect.objectContaining({ id: 'doc-123_chunk_1' }),
          expect.objectContaining({ id: 'doc-123_chunk_2' })
        ])
      );
    });
  });

  describe('searchByText', () => {
    it('should convert text to vector and perform search', async () => {
      // Mock AI embedding response
      mockAi.run.mockResolvedValue({
        shape: [1, 1536],
        data: [mockEmbedding]
      });

      // Mock vectorize query response
      const mockSearchResults = {
        matches: [
          {
            id: 'doc-123',
            score: 0.95,
            metadata: {
              fileId: 'doc-123',
              text: 'This is a financial document',
              timestamp: '2023-01-01T00:00:00.000Z',
              mimeType: 'application/pdf'
            }
          },
          {
            id: 'doc-456',
            score: 0.85,
            metadata: {
              fileId: 'doc-456',
              text: 'Another document',
              timestamp: '2023-01-02T00:00:00.000Z'
            }
          }
        ],
        count: 2
      };
      mockVectorize.query.mockResolvedValue(mockSearchResults);

      const result = await vectorizeService.searchByText('office expenses');

      // Verify AI was called for the query text
      expect(mockAi.run).toHaveBeenCalledWith('@cf/baai/bge-base-en-v1.5', {
        text: ['office expenses']
      });

      // Verify vectorize was called with the generated vector
      expect(mockVectorize.query).toHaveBeenCalledWith(mockEmbedding, {
        topK: 10,
        returnMetadata: true,
        returnValues: false,
        filter: undefined
      });

      // Verify the results are transformed correctly
      expect(result).toEqual(
        mockSearchResults.matches.map(match => ({
          ...match.metadata,
          id: match.id,
          score: match.score,
        }))
      );
    });

    it('should handle search with custom options', async () => {
      // Mock AI embedding response
      mockAi.run.mockResolvedValue({
        shape: [1, 1536],
        data: [mockEmbedding]
      });

      // Mock vectorize query response
      const mockSearchResults = {
        matches: [
          {
            id: 'doc-123',
            score: 0.95,
            metadata: {
              fileId: 'doc-123',
              text: 'This is a financial document',
              timestamp: '2023-01-01T00:00:00.000Z',
              mimeType: 'application/pdf'
            }
          },
          {
            id: 'doc-456',
            score: 0.85,
            metadata: {
              fileId: 'doc-456',
              text: 'Another document',
              timestamp: '2023-01-02T00:00:00.000Z'
            }
          }
        ],
        count: 2
      };
      mockVectorize.query.mockResolvedValue(mockSearchResults);

      const result = await vectorizeService.searchByText('custom search query', {
        topK: 5,
        returnMetadata: false,
        returnValues: true,
        filter: { tag: 'urgent' }
      });

      // Verify AI was called to generate embeddings
      expect(mockAi.run).toHaveBeenCalledWith('@cf/baai/bge-base-en-v1.5', {
        text: ['custom search query']
      });

      // Verify vectorize was called with custom options
      expect(mockVectorize.query).toHaveBeenCalledWith(mockEmbedding, {
        topK: 5,
        returnMetadata: false,
        returnValues: true,
        filter: { tag: 'urgent' }
      });

      // Verify the results are transformed correctly
      expect(result).toEqual(
        mockSearchResults.matches.map(match => ({
          ...match.metadata,
          id: match.id,
          score: match.score,
        }))
      );
    });
  });

  describe('createVectorizeService', () => {
    it('should create a new VectorizeService instance', async () => {
      const { createVectorizeService } = await import('../../src/ai/services/vectorize-service.js');
      
      const service = createVectorizeService(mockConfig);
      
      expect(service).toBeInstanceOf(VectorizeService);
    });
  });

  describe('error handling and edge cases', () => {
    let vectorizeService: VectorizeService;

    beforeEach(async () => {
        const { createVectorizeService } = await import('../../src/ai/services/vectorize-service.js');
        vectorizeService = createVectorizeService(mockConfig);
    });

    it('should handle AI service errors', async () => {
      mockAi.run.mockRejectedValue(new AIServiceError('AI service unavailable', 'SERVICE_UNAVAILABLE'));
      
      await expect(vectorizeService.embedDocument('doc-123', 'test content')).rejects.toThrow('AI service unavailable');
    });

    it('should handle vectorize insertion errors', async () => {
      mockAi.run.mockResolvedValue({
        shape: [1, 1536],
        data: [mockEmbedding]
      });
      mockVectorize.insert.mockRejectedValue(new Error('Vectorize insertion failed'));
      
      const result = await vectorizeService.embedDocument('doc-123', 'test content');

      expect(result).toEqual({
        success: false,
        chunksCreated: 0,
        error: 'Vectorize insertion failed'
      });
      
      expect(mockAi.run).toHaveBeenCalledTimes(1);
    });

    it('should handle very long text by truncating', async () => {
       const longText = 'a '.repeat(10000);
       const mockEmbedding = Array(1536).fill(0.1);
       mockAi.run.mockResolvedValue({
         shape: [1, 1536],
         data: [mockEmbedding]
       });
       
       mockVectorize.insert.mockResolvedValue({
        count: 1,
        ids: ['doc-123']
      });

       const result = await vectorizeService.embedDocument('doc-123', longText);

       expect(mockAi.run).toHaveBeenCalled();
       expect(result.success).toBe(true);
    });

    it('should handle malformed search responses', async () => {
       // Mock a malformed response from vectorize
       mockVectorize.query.mockResolvedValue({ matches: [] }); // Empty matches
       
       const result = await vectorizeService.searchByText('query');

       // Should handle gracefully with empty results
       expect(result.matches).toEqual([]);
    });
  });
});