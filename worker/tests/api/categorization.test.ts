/**
 * Tests for Transaction Categorization API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../../src/index';
import type { Env } from '../../src/types';
import { sign } from 'hono/jwt';

// Type definitions for test responses
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

interface CategorizationData {
  suggestionId: string;
  category: string;
  confidence: number;
  requiresApproval: boolean;
  accountId?: string;
}

interface PendingData {
  suggestions: any[];
}

interface HistoryData {
  history: any[];
  analytics: any;
}

// Mock KV storage for categorization suggestions
const mockKVStorage = new Map<string, string>();
const mockKVCache = {
  get: vi.fn().mockImplementation((key: string, type?: string) => {
    const value = mockKVStorage.get(key);
    if (type === 'json' && value) {
      try {
        return Promise.resolve(JSON.parse(value));
      } catch (__e) {
        return Promise.resolve(null);
      }
    }
    return Promise.resolve(value || null);
  }),
  put: vi.fn().mockImplementation((key: string, value: string, _options?: any) => {
    mockKVStorage.set(key, value);
    return Promise.resolve(undefined);
  }),
  delete: vi.fn().mockImplementation((key: string) => {
    mockKVStorage.delete(key);
    return Promise.resolve(undefined);
  }),
  list: vi.fn().mockImplementation((options?: { prefix?: string }) => {
    let keys = Array.from(mockKVStorage.keys());
    if (options?.prefix) {
      keys = keys.filter(key => key.startsWith(options.prefix));
    }
    const keyObjects = keys.map(name => ({ name }));
    return Promise.resolve({ keys: keyObjects });
  }),
  getWithMetadata: vi.fn().mockImplementation((key: string) => {
    const value = mockKVStorage.get(key);
    return Promise.resolve({ value: value || null, metadata: null });
  }),
};

// Mock database storage
const mockDbAccounts = new Map<string, any>();
const mockDbTransactions = new Map<string, any>();

// Mock the database
vi.mock('@finance-manager/db', () => ({
  createDatabase: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockImplementation(async () => {
            return Promise.resolve(Array.from(mockDbAccounts.values()));
          })
        }))
      })
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue(undefined)
        })
      })
    })
  })
}));

// Mock the DatabaseAdapter and FinancialAIService from core
const mockFinancialAIService = {
  categorizeExpense: vi.fn().mockImplementation(async () => ({
    category: 'Food & Dining',
    confidence: 0.85,
    reasoning: 'Transaction at a restaurant'
  }))
};

vi.mock('@finance-manager/core', () => ({
  DatabaseAdapter: vi.fn().mockImplementation(() => ({
    getAllAccounts: vi.fn().mockImplementation(async () => {
      return Promise.resolve(Array.from(mockDbAccounts.values()));
    })
  })),
  FinancialAIService: vi.fn().mockImplementation(() => mockFinancialAIService)
}));

// Mock the AI package
vi.mock('@finance-manager/ai', () => ({
  AIService: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockImplementation(async () => ({
      response: JSON.stringify({
        category: 'Food & Dining',
        confidence: 0.85,
        reasoning: 'Transaction at a restaurant'
      })
    }))
  })),
  FinancialAIService: vi.fn().mockImplementation(() => ({
    categorizeExpense: vi.fn().mockImplementation(async () => ({
      category: 'Food & Dining',
      confidence: 0.85,
      reasoning: 'Transaction at a restaurant'
    }))
  })),
  createProvider: vi.fn().mockReturnValue({})
}));

// Mock AI service
const mockAIService = {
  run: vi.fn().mockImplementation(async () => {
    return {
      response: JSON.stringify({
        category: 'Food & Dining',
        confidence: 0.85,
        reasoning: 'Transaction at a restaurant'
      })
    };
  })
};

// Mock environment
const mockEnv: Env = {
  ENVIRONMENT: 'test',
  JWT_SECRET: 'test-jwt-secret-key-for-testing-purposes-only' as string,
  AUTH_SESSION_DURATION: '7d',
  FINANCE_MANAGER_CACHE: mockKVCache,
  FINANCE_MANAGER_DOCUMENTS: {} as any,
  FINANCE_MANAGER_DB: {} as any,
  AI: {
    ...mockAIService,
    aiGatewayLogId: undefined,
    gateway: {} as any,
    autorag: {} as any,
    models: {} as any,
    toMarkdown: vi.fn()
  } as any,
  DOCUMENT_EMBEDDINGS: {} as any
};

// Mock user
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

// Helper to create authenticated JWT token
const createTestToken = async (payload: any = mockUser) => {
  return await sign(payload, mockEnv.JWT_SECRET);
};

// Helper to create authenticated request
const createAuthenticatedRequest = async (method: string, url: string, body?: any) => {
  const token = await createTestToken();
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
};

describe('Categorization API', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockKVStorage.clear();
    mockDbAccounts.clear();
    mockDbTransactions.clear();
    
    // Clear KV cache mock calls
    mockKVCache.get.mockClear();
    mockKVCache.put.mockClear();
    mockKVCache.delete.mockClear();
    mockKVCache.list.mockClear();
    
    // Reset AI service mocks to default behavior
    mockAIService.run.mockImplementation(async () => {
      return {
        response: JSON.stringify({
          category: 'Food & Dining',
          confidence: 0.85,
          reasoning: 'Transaction at a restaurant'
        })
      };
    });
    
    // Don't reset FinancialAIService mock in beforeEach to allow test-specific overrides
    // mockFinancialAIService.categorizeExpense.mockImplementation(async () => ({
    //   category: 'Food & Dining',
    //   confidence: 0.85,
    //   reasoning: 'Transaction at a restaurant'
    // }));
    
    // Create session for authenticated user
    const sessionKey = `session:${mockUser.id}`;
    await mockKVStorage.set(sessionKey, JSON.stringify({
      id: mockUser.id,
      email: mockUser.email,
      name: 'Test User'
    }));
    
    // Add some mock accounts
    mockDbAccounts.set('1', {
      id: '1',
      name: 'Dining Out',
      category: 'Food & Dining',
      type: 'expense',
      userId: 'test-user-id'
    });
    mockDbAccounts.set('2', {
      id: '2', 
      name: 'Groceries',
      category: 'Food',
      type: 'expense',
      userId: 'test-user-id'
    });
  });

  describe('POST /api/categorization/suggest', () => {
    it('should generate categorization suggestion successfully', async () => {
      const requestBody = {
        description: 'McDonald\'s Restaurant',
        amount: 12.5,
        merchant: 'McDonald\'s'
      };

      const request = await createAuthenticatedRequest('POST', 'http://localhost/api/categorization/suggest', requestBody);
      const response = await worker.fetch(request, mockEnv);

      if (response.status !== 200) {
        const errorText = await response.text();
        console.log('Error response status:', response.status);
        console.log('Error response body:', errorText);
        console.log('Error response headers:', Object.fromEntries(response.headers.entries()));
      }

      expect(response.status).toBe(200);
      
      const data = await response.json() as ApiResponse<CategorizationData>;
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('suggestionId');
      expect(data.data).toHaveProperty('category', 'Food & Dining');
      expect(data.data).toHaveProperty('confidence', 0.85);
      expect(data.data).toHaveProperty('requiresApproval', false);
      expect(data.data).toHaveProperty('accountId', '1');
    });

    it('should require approval for low confidence suggestions', async () => {
      const requestBody = {
        description: 'Unknown merchant XYZ',
        amount: 50
      };

      // Mock FinancialAIService constructor to return low confidence
      const { FinancialAIService } = await import('@finance-manager/ai');
      vi.mocked(FinancialAIService).mockImplementationOnce(() => ({
        categorizeExpense: vi.fn().mockResolvedValue({
          category: 'Unknown',
          confidence: 0.3,
          reasoning: 'Low confidence categorization'
        })
      }) as any);

      const request = await createAuthenticatedRequest('POST', 'http://localhost/api/categorization/suggest', requestBody);
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as ApiResponse<CategorizationData>;
      console.log('Low confidence test response:', JSON.stringify(data, null, 2));
      expect(data.success).toBe(true);
      expect(data.data.requiresApproval).toBe(true);
      expect(data.data.confidence).toBe(0.3);
    });

    it('should validate request body', async () => {
      const invalidBody = {
        description: '', // Empty description should fail
        amount: 'invalid' // Invalid amount type
      };

      const request = await createAuthenticatedRequest('POST', 'http://localhost/api/categorization/suggest', invalidBody);
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(400);
      
      const data = await response.json() as ApiResponse;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
      expect((data as any).details).toBeDefined();
    });

    it('should store suggestion in KV cache', async () => {
      const requestBody = {
        description: 'Test transaction',
        amount: 25,
        merchant: 'Test Merchant',
        transactionId: 'txn123'
      };

      const request = await createAuthenticatedRequest('POST', 'http://localhost/api/categorization/suggest', requestBody);
      const response = await worker.fetch(request, mockEnv);
      
      if (response.status !== 200) {
        const errorText = await response.text();
        console.log('Error response status:', response.status);
        console.log('Error response body:', errorText);
        console.log('Error response headers:', Object.fromEntries(response.headers.entries()));
      }

      expect(response.status).toBe(200);
      
      // Check that the suggestion was stored in KV
      const storedKeys = Array.from(mockKVStorage.keys());
      const categorizationKey = storedKeys.find(key => 
        key.startsWith('categorization:test-user-id:cat_')
      );
      
      expect(categorizationKey).toBeDefined();
      
      if (categorizationKey) {
        const storedValue = mockKVStorage.get(categorizationKey);
        expect(storedValue).toContain('"description":"Test transaction"');
        expect(storedValue).toContain('"amount":25');
      }
    });
  })

  describe('GET /api/categorization/pending', () => {
    it('should return pending suggestions', async () => {
      const mockSuggestion = {
        id: 'cat_123',
        description: 'Test transaction',
        amount: 25.00,
        suggestedCategory: 'Food & Dining',
        confidence: 0.85,
        status: 'pending',
        userId: 'test-user-id',
        timestamp: Date.now()
      };

      mockKVStorage.set('categorization:test-user-id:cat_123', JSON.stringify(mockSuggestion));

      const request = await createAuthenticatedRequest('GET', 'http://localhost/api/categorization/pending');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as ApiResponse<any[]>;
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toMatchObject({
        id: 'cat_123',
        description: 'Test transaction',
        status: 'pending'
      });
    });

    it('should filter out non-pending suggestions', async () => {
      const approvedSuggestion = {
        id: 'cat_123',
        status: 'approved',
        userId: 'test-user-id'
      };

      mockKVStorage.set('categorization:test-user-id:cat_123', JSON.stringify(approvedSuggestion));

      const request = await createAuthenticatedRequest('GET', 'http://localhost/api/categorization/pending');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as ApiResponse<any[]>;
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });
  })

  describe('POST /api/categorization/approve', () => {
    it('should approve a suggestion successfully', async () => {
      const mockSuggestion = {
        id: 'cat_123',
        description: 'Test transaction',
        suggestedCategory: 'Food & Dining',
        status: 'pending',
        userId: 'test-user-id'
      };

      mockKVStorage.set('categorization:test-user-id:cat_123', JSON.stringify(mockSuggestion));

      const requestBody = {
        suggestionId: 'cat_123',
        approved: true
      };

      const request = await createAuthenticatedRequest('POST', 'http://localhost/api/categorization/approve', requestBody);
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as ApiResponse<any>;
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('approved');
      
      // Verify suggestion was updated in cache
      expect(mockKVCache.put).toHaveBeenCalledWith(
        'categorization:test-user-id:cat_123',
        expect.stringContaining('"status":"approved"'),
        { expirationTtl: 86400 * 30 }
      );
    });

    it('should reject a suggestion successfully', async () => {
      const mockSuggestion = {
        id: 'cat_123',
        status: 'pending',
        userId: 'test-user-id'
      };

      mockKVStorage.set('categorization:test-user-id:cat_123', JSON.stringify(mockSuggestion));

      const requestBody = {
        suggestionId: 'cat_123',
        approved: false
      };

      const request = await createAuthenticatedRequest('POST', 'http://localhost/api/categorization/approve', requestBody);
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as ApiResponse<any>;
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('rejected');
    });

    it('should return 404 for non-existent suggestion', async () => {
      const requestBody = {
        suggestionId: 'nonexistent',
        approved: true
      };

      const request = await createAuthenticatedRequest('POST', 'http://localhost/api/categorization/approve', requestBody);
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Suggestion not found or expired');
    });
  })

  describe('GET /api/categorization/history', () => {
    it('should return categorization history with analytics', async () => {
      // Clear ALL KV storage and reset completely
      mockKVStorage.clear();
      
      // Re-create session for authenticated user
      const sessionKey = `session:${mockUser.id}`;
      await mockKVStorage.set(sessionKey, JSON.stringify({
        id: mockUser.id,
        email: mockUser.email,
        name: 'Test User'
      }));
      
      const mockSuggestions = [
        {
          id: 'cat_1',
          suggestedCategory: 'Food & Dining',
          status: 'approved',
          confidence: 0.9,
          timestamp: Date.now() - 1000,
          userId: 'test-user-id'
        },
        {
          id: 'cat_2',
          suggestedCategory: 'Transportation',
          status: 'rejected',
          confidence: 0.7,
          timestamp: Date.now() - 2000,
          userId: 'test-user-id'
        }
      ];

      mockKVStorage.set('categorization:test-user-id:cat_1', JSON.stringify(mockSuggestions[0]));
      mockKVStorage.set('categorization:test-user-id:cat_2', JSON.stringify(mockSuggestions[1]));

      const request = await createAuthenticatedRequest('GET', 'http://localhost/api/categorization/history');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as ApiResponse<HistoryData>;
      expect(data.success).toBe(true);
      expect(data.data.suggestions).toHaveLength(2);
      expect(data.data.analytics).toMatchObject({
        total: 2,
        approved: 1,
        rejected: 1,
        pending: 0,
        averageConfidence: 0.8
      });
      expect(data.data.analytics.topCategories).toContainEqual({
        category: 'Food & Dining',
        count: 1
      });
    });

    it('should filter by status when specified', async () => {
      const mockSuggestion = {
        id: 'cat_1',
        status: 'approved',
        userId: 'test-user-id'
      };

      mockKVStorage.set('categorization:test-user-id:cat_1', JSON.stringify(mockSuggestion));

      const request = await createAuthenticatedRequest('GET', 'http://localhost/api/categorization/history?status=approved');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as ApiResponse<HistoryData>;
      expect(data.success).toBe(true);
      expect(data.data.suggestions).toHaveLength(1);
    });
  })

  describe('DELETE /api/categorization/suggestion/:id', () => {
    it('should delete a suggestion successfully', async () => {
      const mockSuggestion = {
        id: 'cat_123',
        userId: 'test-user-id'
      };

      mockKVStorage.set('categorization:test-user-id:cat_123', JSON.stringify(mockSuggestion));

      const request = await createAuthenticatedRequest('DELETE', 'http://localhost/api/categorization/suggestion/cat_123');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as ApiResponse<any>;
      expect(data.success).toBe(true);
      expect((data as any).message).toBe('Suggestion deleted successfully');
      
      expect(mockKVCache.delete).toHaveBeenCalledWith(
        'categorization:test-user-id:cat_123'
      );
    });

    it('should return 404 for non-existent suggestion', async () => {
      const request = await createAuthenticatedRequest('DELETE', 'http://localhost/api/categorization/suggestion/nonexistent');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(404);
      
      const data = await response.json() as ApiResponse;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Suggestion not found');
    });
  })
})