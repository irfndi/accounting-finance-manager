import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import uploadsRouter from '../../src/routes/api/uploads'; // Import the uploads router
import type { Env } from '../../src/types';

// Mock the dependencies
vi.mock('../../src/middleware/auth', () => ({
  authMiddleware: vi.fn((c, next) => {
    // Set user in context like the real middleware does
    c.set('user', {
      id: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      firstName: 'Test',
      lastName: 'User'
    });
    return next();
  }),
  getCurrentUser: vi.fn((c) => {
    const user = c.get('user');
    if (!user) {
      throw new Error('User not found in context');
    }
    return user;
  })
}));

vi.mock('../../src/utils/ocr', () => ({
  extractTextFromDocument: vi.fn().mockResolvedValue('Sample extracted text'),
  processOCR: vi.fn().mockResolvedValue({
    success: true,
    text: 'Sample OCR extracted text',
    confidence: 0.95,
    processingTime: 100
  }),
  isOCRSupported: vi.fn().mockReturnValue(true),
  createOCRLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    databaseOperation: vi.fn()
  })),
  generateSearchableText: vi.fn((text) => text.toLowerCase())
}));

vi.mock('../../src/utils/raw-docs', () => ({
  createRawDoc: vi.fn().mockResolvedValue({ success: true, data: { id: 'test-doc-id' } }),
  updateRawDocOCR: vi.fn().mockResolvedValue({ success: true }),
  updateRawDocLLM: vi.fn().mockResolvedValue({ success: true }),
  getRawDocByFileId: vi.fn().mockResolvedValue({ success: true, doc: { id: 'test-doc-id', filename: 'test.pdf' } }),
  generateSearchableText: vi.fn((text) => text.toLowerCase()),
  parseTags: vi.fn((tags: string) => tags.split(',').map((tag: string) => tag.trim())),
  getUploadStats: vi.fn().mockResolvedValue({ totalFiles: 0, totalSize: 0 })
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
  })
}));

// Create mock functions that can be reconfigured per test
const mockEmbedDocument = vi.fn().mockResolvedValue({ success: true, chunksCreated: 1 });

// Create mock AI and Vectorize instances
let mockAi: any;
let mockVectorize: any;

// Create mock vectorize service that can be reconfigured per test
const mockVectorizeService = {
  searchByText: vi.fn().mockResolvedValue({
    matches: [],
    query: 'test query',
    totalMatches: 0,
    threshold: 0.7,
    processingTime: 100
  }),
  embedDocument: mockEmbedDocument
};

vi.mock('@finance-manager/ai', async () => {
  const actual = await vi.importActual('@finance-manager/ai') as any;
  return {
    ...actual,
    createVectorizeService: vi.fn((config) => {
      // Use the real VectorizeService with mocked dependencies
      return new actual.VectorizeService({
        ...config,
        ai: config.ai || mockAi,
        vectorize: config.vectorize || mockVectorize
      });
    }),
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
      }),
      generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3])
    })),
    FinancialAIService: vi.fn(() => ({
      classifyDocument: vi.fn().mockResolvedValue({
        type: 'invoice',
        confidence: 0.95,
        subtype: 'standard'
      }),
      extractDocumentData: vi.fn().mockResolvedValue({
        amount: 100,
        date: '2024-01-01',
        vendor: 'Test Vendor'
      })
    })),
    OpenRouterProvider: vi.fn(() => ({
      generateText: vi.fn().mockResolvedValue('Generated text'),
      generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3])
    }))
  };
});

// Mock JWT verification
vi.mock('hono/jwt', () => ({
  verify: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com'
  })
}));

const createMockEnv = (): Env => ({
  ENVIRONMENT: 'test',
  JWT_SECRET: 'test-secret',
  AUTH_SESSION_DURATION: '1h',
  FINANCE_MANAGER_DB: {} as any, // Mock D1Database
  FINANCE_MANAGER_DOCUMENTS: {
    put: vi.fn().mockResolvedValue({ key: 'test-file-id' }),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn().mockResolvedValue({ objects: [] }),
  } as any, // Mock R2Bucket
  FINANCE_MANAGER_CACHE: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  } as any, // Mock KVNamespace
  AI: {} as any, // Mock Ai
  DOCUMENT_EMBEDDINGS: {} as any, // Mock VectorizeIndex
  OPENROUTER_API_KEY: 'test-openrouter-key',
});

describe('Uploads API', () => {
  let app: Hono<{ Bindings: Env; Variables: { ai: any; vectorize: any } }>;
  let mockEnv: any;

  beforeEach(() => {
    app = new Hono<{ Bindings: Env; Variables: { ai: any; vectorize: any } }>();
    app.use('*', (c, next) => {
      c.env = mockEnv;
      c.set('ai', mockEnv.AI);
      c.set('vectorize', mockEnv.DOCUMENT_EMBEDDINGS);
      return next();
    });
    app.route('/api/uploads', uploadsRouter);

    mockAi = {
      run: vi.fn().mockResolvedValue({
        shape: [1, 384],
        data: [[0.1, 0.2, 0.3, 0.4, 0.5]]
      }),
    };
    mockVectorize = {
      query: vi.fn().mockResolvedValue({
        matches: [
          {
            id: 'test-doc-1',
            score: 0.95,
            metadata: { fileId: 'test-file-1', userId: 'test-user' },
            values: [0.1, 0.2, 0.3]
          }
        ]
      }),
      upsert: vi.fn(),
      insert: vi.fn(),
    };

    mockEnv = {
      ...createMockEnv(),
      AI: mockAi,
      DOCUMENT_EMBEDDINGS: mockVectorize,
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
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: formData
      });
      
      const res = await app.fetch(req);
      const data = await res.json() as { success: boolean; error?: string; data?: any };

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data?.originalName).toBe('test.pdf');
    });

    it('should handle missing file upload', async () => {
      const formData = new FormData();
      formData.append('category', 'invoice');

      const req = new Request('http://localhost/api/uploads', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: formData
      });
      
      const res = await app.fetch(req);
      const data = await res.json() as { success: boolean; error?: string; data?: any };

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No file provided');
    });

    it('should validate file type', async () => {
      const formData = new FormData();
      const file = new File(['test content'], 'test.exe', { type: 'application/x-executable' });
      formData.append('file', file);
      formData.append('category', 'invoice');

      const req = new Request('http://localhost/api/uploads', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: formData
      });
      
      const res = await app.fetch(req);
      const data = await res.json() as { success: boolean; error?: string; data?: any };

      expect(res.status).toBe(415);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unsupported file type');
    });

    it('should generate embeddings and store in Vectorize', async () => {
      const formData = new FormData();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('category', 'invoice');

      const req = new Request('http://localhost/api/uploads', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: formData
      });
      
      await app.fetch(req);

      // Verify AI embedding generation was called
      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        '@cf/baai/bge-base-en-v1.5',
        expect.objectContaining({
          text: expect.any(Array)
        })
      );

      // Verify Vectorize insert was called
      expect(mockEnv.DOCUMENT_EMBEDDINGS.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            values: expect.any(Array),
            metadata: expect.objectContaining({
              fileName: 'test.pdf',
              documentType: 'invoice'
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
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          query: 'invoice payment',
          limit: 5
        })
      });
      
      const res = await app.fetch(req);
      const data = await res.json() as { success: boolean; error?: string; data?: { results: any[]; totalMatches: number; threshold: number } };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.results).toBeDefined();
      expect(Array.isArray(data.data?.results)).toBe(true);
    });

    it('should validate search query', async () => {
      const req = new Request('http://localhost/api/uploads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          limit: 5
        })
      });
      
      const res = await app.fetch(req);
      const data = await res.json() as { success?: boolean; error?: string };

      expect(res.status).toBe(400);
      expect(data.success).toBeUndefined();
      expect(data.error).toBe('Search query is required');
    });

    it('should handle search with filters', async () => {
      const req = new Request('http://localhost/api/uploads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          query: 'invoice payment',
          filter: {
            category: 'invoice'
          },
          limit: 10
        })
      });
      
      const res = await app.fetch(req);
      const data = await res.json() as { success: boolean; error?: string; data?: { results: any[]; totalMatches: number; threshold: number } };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data?.results)).toBe(true);
      
      // Verify Vectorize query was called with proper parameters
      expect(mockEnv.DOCUMENT_EMBEDDINGS.query).toHaveBeenCalledWith(
        expect.any(Array), // embedding vector
        expect.objectContaining({
          topK: 10,
          filter: expect.objectContaining({
            userId: 'test-user-id',
            category: 'invoice'
          }),
          returnMetadata: true,
          returnValues: false
        })
      );
    });

    it('should generate embeddings for search query', async () => {
      const searchQuery = 'invoice payment terms';
      
      // Reset the mock to track calls
      vi.clearAllMocks();
      
      // Create a spy on the AI.run method
      const aiRunSpy = vi.spyOn(mockEnv.AI, 'run');
      
      const req = new Request('http://localhost/api/uploads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 5
        })
      });

      const response = await app.fetch(req);
      
      // Check that the response is successful
      expect(response.status).toBe(200);
      
      // Verify AI was called to generate embeddings for the search query
      expect(aiRunSpy).toHaveBeenCalledWith(
        '@cf/baai/bge-base-en-v1.5',
        expect.objectContaining({
          text: [searchQuery]
        })
      );
    });
  });

  describe('GET /api/uploads', () => {
    it('should list uploaded documents', async () => {
      const req = new Request('http://localhost/api/uploads', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const res = await app.fetch(req);
      const data = await res.json() as { success: boolean; error?: string; data?: { files: any[]; hasMore: boolean; total: number } };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data?.files)).toBe(true);
    });

    it('should filter documents by category', async () => {
      const req = new Request('http://localhost/api/uploads?category=invoice', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const res = await app.fetch(req);
      
      if (res.status !== 200) {
        const errorText = await res.text();
        // Error response logged
        throw new Error(`Expected 200 but got ${res.status}: ${errorText}`);
      }
      
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
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: formData
      });

      // Debug environment structure
      // Mock environment structure checked
      // FINANCE_MANAGER_DOCUMENTS existence verified
      
      const res = await app.fetch(req);
      
      // Debug logging
      if (res.status !== 201) {
        // Response status checked
      const responseText = await res.text();
      // Response text retrieved
        throw new Error(`Expected 201 but got ${res.status}: ${responseText}`);
      }
      
      const data = await res.json() as { success: boolean; error?: string; data?: any };

      // Should still succeed even if Vectorize fails
      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should handle AI embedding generation errors', async () => {
      // Import AIServiceError for proper error type
      const { AIServiceError } = await import('@finance-manager/ai');
      
      // Mock AI.run to throw an error for this test
      const searchError = new AIServiceError('Failed to generate embeddings', 'EMBEDDING_FAILED');
      // Ensure the error has the correct name property
      searchError.name = 'AIServiceError';
      mockAi.run.mockRejectedValueOnce(searchError);
      
      const req = new Request('http://localhost/api/uploads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          query: 'test query',
          limit: 5
        })
      });

      const res = await app.fetch(req);
      
      expect(res.status).toBe(500);
      
      const data = await res.json();
         
       // The response format depends on where the error is caught
       // If caught by our route handler, it has { success: false, error: string }
       // If caught by global error handler, it has { error: string, message: string }
       if (data && typeof data === 'object' && 'success' in data) {
         // Our route handler caught the error
         expect((data as any).success).toBe(false);
         expect((data as any).error).toContain('Failed to generate embeddings');
       } else if (data && typeof data === 'object' && 'error' in data) {
         // Global error handler caught the error
         expect((data as any).error).toBe('Internal server error');
         expect((data as any).message).toBeDefined();
       } else {
        throw new Error('Unexpected error response format');
       }
      
      // Reset the mock for other tests
      mockVectorizeService.searchByText.mockResolvedValue({
        matches: [],
        query: 'test query',
        totalMatches: 0,
        threshold: 0.7,
        processingTime: 100
      });
    });
  });
});