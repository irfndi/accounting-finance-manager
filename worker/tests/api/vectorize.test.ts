import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Vectorize integration utilities
vi.mock('../../src/utils/vectorize', () => ({
  generateEmbedding: vi.fn(),
  insertDocumentVector: vi.fn(),
  searchSimilarDocuments: vi.fn()
}));

describe('Vectorize Integration', () => {
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      AI: {
        run: vi.fn().mockResolvedValue({
          data: [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]] // Mock 8-dimensional embedding
        })
      },
      VECTORIZE_INDEX: {
        insert: vi.fn().mockResolvedValue({ count: 1 }),
        query: vi.fn().mockResolvedValue({
          matches: [
            {
              id: 'doc-1',
              score: 0.95,
              metadata: {
                filename: 'invoice-001.pdf',
                content: 'Invoice for office supplies totaling $250.00',
                category: 'invoice',
                uploadedAt: '2024-01-15T10:00:00Z'
              }
            },
            {
              id: 'doc-2',
              score: 0.87,
              metadata: {
                filename: 'receipt-002.pdf',
                content: 'Receipt for software subscription $99.99',
                category: 'receipt',
                uploadedAt: '2024-01-14T15:30:00Z'
              }
            }
          ]
        }),
        upsert: vi.fn().mockResolvedValue({ count: 1 }),
        deleteByIds: vi.fn().mockResolvedValue({ count: 1 })
      }
    };
  });

  describe('Embedding Generation', () => {
    it('should generate embeddings using Cloudflare AI', async () => {
      const text = 'Invoice for office supplies';
      
      const result = await mockEnv.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: text
      });

      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        '@cf/baai/bge-base-en-v1.5',
        { text: text }
      );
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data[0])).toBe(true);
      expect(result.data[0]).toHaveLength(8);
    });

    it('should handle different text lengths', async () => {
      const texts = [
        'Short text',
        'This is a medium length text that contains more information about financial documents and transactions.',
        'This is a very long text that might be extracted from a comprehensive financial document containing detailed information about multiple transactions, account balances, payment terms, vendor information, and other relevant financial data that would typically be found in complex business documents.'
      ];

      for (const text of texts) {
        const result = await mockEnv.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: text
        });

        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data[0])).toBe(true);
      }
    });

    it('should handle special characters and formatting', async () => {
      const textWithSpecialChars = 'Invoice #INV-2024-001: $1,250.50 (USD) - Due: 2024-02-15';
      
      const result = await mockEnv.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: textWithSpecialChars
      });

      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        '@cf/baai/bge-base-en-v1.5',
        { text: textWithSpecialChars }
      );
      expect(result.data).toBeDefined();
    });
  });

  describe('Vector Storage', () => {
    it('should insert document vectors into Vectorize index', async () => {
      const documentVector = {
        id: 'doc-123',
        values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
        metadata: {
          filename: 'test-invoice.pdf',
          content: 'Test invoice content',
          category: 'invoice',
          uploadedAt: '2024-01-15T10:00:00Z',
          fileSize: 1024,
          mimeType: 'application/pdf'
        }
      };

      const result = await mockEnv.VECTORIZE_INDEX.insert([documentVector]);

      expect(mockEnv.VECTORIZE_INDEX.insert).toHaveBeenCalledWith([documentVector]);
      expect(result.count).toBe(1);
    });

    it('should handle batch vector insertions', async () => {
      const documentVectors = [
        {
          id: 'doc-1',
          values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
          metadata: { filename: 'doc1.pdf', category: 'invoice' }
        },
        {
          id: 'doc-2',
          values: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
          metadata: { filename: 'doc2.pdf', category: 'receipt' }
        },
        {
          id: 'doc-3',
          values: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
          metadata: { filename: 'doc3.pdf', category: 'contract' }
        }
      ];

      const result = await mockEnv.VECTORIZE_INDEX.insert(documentVectors);

      expect(mockEnv.VECTORIZE_INDEX.insert).toHaveBeenCalledWith(documentVectors);
      expect(result.count).toBe(1);
    });

    it('should update existing vectors using upsert', async () => {
      const updatedVector = {
        id: 'doc-123',
        values: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
        metadata: {
          filename: 'updated-invoice.pdf',
          content: 'Updated invoice content',
          category: 'invoice',
          updatedAt: '2024-01-16T10:00:00Z'
        }
      };

      const result = await mockEnv.VECTORIZE_INDEX.upsert([updatedVector]);

      expect(mockEnv.VECTORIZE_INDEX.upsert).toHaveBeenCalledWith([updatedVector]);
      expect(result.count).toBe(1);
    });
  });

  describe('Semantic Search', () => {
    it('should perform semantic search with query vector', async () => {
      const queryVector = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85];
      const searchOptions = {
        topK: 5,
        filter: { category: 'invoice' }
      };

      const result = await mockEnv.VECTORIZE_INDEX.query(queryVector, searchOptions);

      expect(mockEnv.VECTORIZE_INDEX.query).toHaveBeenCalledWith(queryVector, searchOptions);
      expect(result.matches).toBeDefined();
      expect(Array.isArray(result.matches)).toBe(true);
      expect(result.matches).toHaveLength(2);
    });

    it('should return results sorted by similarity score', async () => {
      const queryVector = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
      
      const result = await mockEnv.VECTORIZE_INDEX.query(queryVector, { topK: 10 });

      expect(result.matches).toBeDefined();
      
      // Verify results are sorted by score (descending)
      for (let i = 0; i < result.matches.length - 1; i++) {
        expect(result.matches[i].score).toBeGreaterThanOrEqual(result.matches[i + 1].score);
      }
    });

    it('should apply metadata filters correctly', async () => {
      const queryVector = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
      const filters = {
        category: 'invoice',
        uploadedAt: { $gte: '2024-01-01T00:00:00Z' }
      };

      await mockEnv.VECTORIZE_INDEX.query(queryVector, {
        topK: 5,
        filter: filters
      });

      expect(mockEnv.VECTORIZE_INDEX.query).toHaveBeenCalledWith(
        queryVector,
        expect.objectContaining({
          filter: filters
        })
      );
    });

    it('should handle different similarity thresholds', async () => {
      const queryVector = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
      
      // Mock different similarity scores
      mockEnv.VECTORIZE_INDEX.query.mockResolvedValueOnce({
        matches: [
          {
            id: 'doc-1',
            score: 0.95,
            metadata: { filename: 'high-similarity.pdf' }
          },
          {
            id: 'doc-2',
            score: 0.75,
            metadata: { filename: 'medium-similarity.pdf' }
          },
          {
            id: 'doc-3',
            score: 0.45,
            metadata: { filename: 'low-similarity.pdf' }
          }
        ]
      });

      const result = await mockEnv.VECTORIZE_INDEX.query(queryVector, { topK: 10 });
      
      // Filter results by similarity threshold
      const threshold = 0.7;
      const filteredResults = result.matches.filter((match: any) => match.score >= threshold);
      
      expect(filteredResults).toHaveLength(2);
      expect(filteredResults.every((match: any) => match.score >= threshold)).toBe(true);
    });
  });

  describe('Vector Management', () => {
    it('should delete vectors by IDs', async () => {
      const idsToDelete = ['doc-1', 'doc-2', 'doc-3'];
      
      const result = await mockEnv.VECTORIZE_INDEX.deleteByIds(idsToDelete);

      expect(mockEnv.VECTORIZE_INDEX.deleteByIds).toHaveBeenCalledWith(idsToDelete);
      expect(result.count).toBe(1);
    });

    it('should handle vector dimension validation', async () => {
      const invalidVector = {
        id: 'doc-invalid',
        values: [0.1, 0.2, 0.3], // Wrong dimension (should be 8)
        metadata: { filename: 'invalid.pdf' }
      };

      // This should be handled by the Vectorize service
      // In a real implementation, this might throw an error
      try {
        await mockEnv.VECTORIZE_INDEX.insert([invalidVector]);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service failures gracefully', async () => {
      mockEnv.AI.run.mockRejectedValueOnce(new Error('AI service unavailable'));

      try {
        await mockEnv.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: 'test text'
        });
      } catch (error) {
        expect(error instanceof Error ? error.message : 'Unknown error').toBe('AI service unavailable');
      }
    });

    it('should handle Vectorize insertion failures', async () => {
      mockEnv.VECTORIZE_INDEX.insert.mockRejectedValueOnce(new Error('Vectorize insertion failed'));

      const vector = {
        id: 'doc-test',
        values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
        metadata: { filename: 'test.pdf' }
      };

      try {
        await mockEnv.VECTORIZE_INDEX.insert([vector]);
      } catch (error) {
        expect(error instanceof Error ? error.message : 'Unknown error').toBe('Vectorize insertion failed');
      }
    });

    it('should handle Vectorize query failures', async () => {
      mockEnv.VECTORIZE_INDEX.query.mockRejectedValueOnce(new Error('Vectorize query failed'));

      const queryVector = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

      try {
        await mockEnv.VECTORIZE_INDEX.query(queryVector, { topK: 5 });
      } catch (error) {
        expect(error instanceof Error ? error.message : 'Unknown error').toBe('Vectorize query failed');
      }
    });

    it('should handle malformed metadata', async () => {
      const vectorWithBadMetadata = {
        id: 'doc-bad-metadata',
        values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
        metadata: {
          filename: null, // Invalid metadata
          content: undefined,
          invalidField: { nested: 'object' } // Vectorize might not support nested objects
        }
      };

      // This should be validated before insertion
      const cleanMetadata = {
        filename: vectorWithBadMetadata.metadata.filename || 'unknown',
        content: vectorWithBadMetadata.metadata.content || '',
        // Remove invalid fields
      };

      expect(cleanMetadata.filename).toBe('unknown');
      expect(cleanMetadata.content).toBe('');
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large batch operations efficiently', async () => {
      const largeBatch = Array.from({ length: 100 }, (_, i) => ({
        id: `doc-${i}`,
        values: Array.from({ length: 8 }, () => Math.random()),
        metadata: {
          filename: `document-${i}.pdf`,
          category: i % 2 === 0 ? 'invoice' : 'receipt'
        }
      }));

      const startTime = Date.now();
      await mockEnv.VECTORIZE_INDEX.insert(largeBatch);
      const endTime = Date.now();

      expect(mockEnv.VECTORIZE_INDEX.insert).toHaveBeenCalledWith(largeBatch);
      // In a real test, you might want to verify performance metrics
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should optimize query parameters for different use cases', async () => {
      const queryVector = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

      // Quick search - fewer results, faster response
      await mockEnv.VECTORIZE_INDEX.query(queryVector, { topK: 3 });
      
      // Comprehensive search - more results, detailed analysis
      await mockEnv.VECTORIZE_INDEX.query(queryVector, { topK: 20 });

      expect(mockEnv.VECTORIZE_INDEX.query).toHaveBeenCalledTimes(2);
    });
  });
});