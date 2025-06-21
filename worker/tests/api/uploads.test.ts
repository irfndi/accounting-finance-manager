import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import uploadsRouter from '../../src/routes/api/uploads';

// Mock the dependencies
vi.mock('../../src/middleware/auth', () => ({
  authMiddleware: vi.fn((c, next) => next()),
  getCurrentUser: vi.fn(() => ({ id: 'test-user-id', email: 'test@example.com' }))
}));

vi.mock('../../src/utils/ocr', () => ({
  extractTextFromDocument: vi.fn().mockResolvedValue('Sample extracted text'),
  createOCRLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    databaseOperation: vi.fn()
  })),
  generateSearchableText: vi.fn((text) => text.toLowerCase())
}));

vi.mock('@finance-manager/db', () => ({
  createDatabase: vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1, filename: 'test.pdf' }])
      })
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 1, filename: 'test.pdf', content: 'Sample content' }])
      })
    })
  }),
  createRawDoc: vi.fn().mockResolvedValue({ success: true, data: { id: 'test-doc-id' } }),
  updateRawDocOCR: vi.fn().mockResolvedValue({ success: true })
}));

// Create mock functions that can be reconfigured per test
const mockEmbedDocument = vi.fn().mockResolvedValue({ success: true, chunksCreated: 1 });
const mockSearchByText = vi.fn().mockResolvedValue({
  success: true,
  results: [{ id: 'doc-1', score: 0.95, metadata: { filename: 'test.pdf' } }],
  totalMatches: 1,
  threshold: 0.8,
  processingTime: 100
});

vi.mock('@finance-manager/ai', () => ({
  createVectorizeService: vi.fn(() => ({
    embedDocument: mockEmbedDocument,
    searchByText: mockSearchByText
  })),
  AIService: vi.fn(() => ({
    classifyDocument: vi.fn().mockResolvedValue({
      type: 'invoice',
      confidence: 0.95,
      subtype: 'standard'
    }),
    extractStructuredData: vi.fn().mockResolvedValue({
      amount: 100,
      date: '2024-01-01',
      vendor: 'Test Vendor'
    })
  }))
}));

describe('Uploads API', () => {
  let app: Hono;
  let mockEnv: any;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/uploads', uploadsRouter);
    
    // Reset mocks
    vi.clearAllMocks();
    mockEmbedDocument.mockResolvedValue({ success: true, chunksCreated: 1 });
    mockSearchByText.mockResolvedValue({
      success: true,
      results: [{ id: 'doc-1', score: 0.95, metadata: { filename: 'test.pdf' } }],
      totalMatches: 1,
      threshold: 0.8,
      processingTime: 100
    });
    
    mockEnv = {
      FINANCE_MANAGER_DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results: [] })
          })
        })
      },
      FINANCE_MANAGER_DOCUMENTS: {
        put: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue({
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
        })
      },
      FINANCE_MANAGER_CACHE: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined)
      },
      AI: {
        run: vi.fn().mockResolvedValue({
          data: [[0.1, 0.2, 0.3, 0.4, 0.5]] // Mock embedding vector
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
                filename: 'test.pdf',
                content: 'Sample content',
                uploadedAt: '2024-01-01T00:00:00Z'
              }
            }
          ]
        })
      }
    };
  });

  describe('POST /api/uploads', () => {
    it('should upload a document successfully', async () => {
      const formData = new FormData();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('category', 'invoice');
      formData.append('description', 'Test invoice');

      const req = new Request('http://localhost/api/uploads', {
        method: 'POST',
        body: formData
      });

      const res = await app.request(req, mockEnv);
      const data = await res.json() as { success: boolean; error?: string; document?: any };

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.document).toBeDefined();
      expect(data.document.filename).toBe('test.pdf');
    });

    it('should handle missing file upload', async () => {
      const formData = new FormData();
      formData.append('category', 'invoice');

      const req = new Request('http://localhost/api/uploads', {
        method: 'POST',
        body: formData
      });

      const res = await app.request(req, mockEnv);
      const data = await res.json() as { success: boolean; error?: string; data?: any };

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No file uploaded');
    });

    it('should validate file type', async () => {
      const formData = new FormData();
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);
      formData.append('category', 'invoice');

      const req = new Request('http://localhost/api/uploads', {
        method: 'POST',
        body: formData
      });

      const res = await app.request(req, mockEnv);
      const data = await res.json() as { success: boolean; error?: string; data?: any };

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid file type');
    });

    it('should generate embeddings and store in Vectorize', async () => {
      const formData = new FormData();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('category', 'invoice');

      const req = new Request('http://localhost/api/uploads', {
        method: 'POST',
        body: formData
      });

      await app.request(req, mockEnv);

      // Verify AI embedding generation was called
      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        '@cf/baai/bge-base-en-v1.5',
        expect.objectContaining({
          text: expect.any(String)
        })
      );

      // Verify Vectorize insert was called
      expect(mockEnv.VECTORIZE_INDEX.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            values: expect.any(Array),
            metadata: expect.objectContaining({
              filename: 'test.pdf',
              category: 'invoice'
            })
          })
        ])
      );
    });
  });

  describe('POST /api/uploads/search', () => {
    it('should perform semantic search successfully', async () => {
      const req = new Request('http://localhost/api/uploads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'invoice payment',
          limit: 5
        })
      });

      const res = await app.request(req, mockEnv);
      const data = await res.json() as { success: boolean; error?: string; results?: any[]; data?: any };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results![0]).toHaveProperty('score');
      expect(data.results![0]).toHaveProperty('metadata');
    });

    it('should validate search query', async () => {
      const req = new Request('http://localhost/api/uploads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          limit: 5
        })
      });

      const res = await app.request(req, mockEnv);
      const data = await res.json() as { success: boolean; error?: string; data?: any };

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Query is required');
    });

    it('should handle search with filters', async () => {
      const req = new Request('http://localhost/api/uploads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'invoice payment',
          filters: {
            category: 'invoice'
          },
          limit: 10
        })
      });

      const res = await app.request(req, mockEnv);
      const data = await res.json() as { success: boolean; error?: string; data?: any };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify Vectorize query was called with proper parameters
      expect(mockEnv.VECTORIZE_INDEX.query).toHaveBeenCalledWith(
        expect.any(Array), // embedding vector
        expect.objectContaining({
          topK: 10,
          filter: expect.objectContaining({
            category: 'invoice'
          })
        })
      );
    });

    it('should generate embeddings for search query', async () => {
      const searchQuery = 'invoice payment terms';
      
      const req = new Request('http://localhost/api/uploads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 5
        })
      });

      await app.request(req, mockEnv);

      // Verify AI was called to generate embeddings for the search query
      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        '@cf/baai/bge-base-en-v1.5',
        expect.objectContaining({
          text: searchQuery
        })
      );
    });
  });

  describe('GET /api/uploads', () => {
    it('should list uploaded documents', async () => {
      const req = new Request('http://localhost/api/uploads', {
        method: 'GET'
      });

      const res = await app.request(req, mockEnv);
      const data = await res.json() as { success: boolean; error?: string; documents?: any[]; data?: any };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.documents)).toBe(true);
    });

    it('should filter documents by category', async () => {
      const req = new Request('http://localhost/api/uploads?category=invoice', {
        method: 'GET'
      });

      const res = await app.request(req, mockEnv);
      const data = await res.json() as { success: boolean; error?: string; data?: any };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle Vectorize insertion errors gracefully', async () => {
      // Mock the embedDocument to fail when Vectorize fails
      mockEmbedDocument.mockResolvedValueOnce({ success: false, error: 'Vectorize error' });
      
      const formData = new FormData();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('category', 'invoice');

      const req = new Request('http://localhost/api/uploads', {
        method: 'POST',
        body: formData
      });

      const res = await app.request(req, mockEnv);
      const data = await res.json() as { success: boolean; error?: string; data?: any };

      // Should still succeed even if Vectorize fails
      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should handle AI embedding generation errors', async () => {
      // Mock the searchByText to throw an error
      mockSearchByText.mockRejectedValueOnce(new Error('AI service error'));
      
      const req = new Request('http://localhost/api/uploads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'test query',
          limit: 5
        })
      });

      const res = await app.request(req, mockEnv);
      const data = await res.json() as { success: boolean; error?: string };

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to generate embeddings');
    });
  });
});