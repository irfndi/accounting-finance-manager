/**
 * Tests for Budgets API Routes
 * Comprehensive test coverage for budget management endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import type { AppContext } from '../../src/worker/types';

// Mock crypto for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn().mockReturnValue('mock-uuid-12345'),
    getRandomValues: vi.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    })
  },
  writable: true
});

// Mock auth middleware FIRST without referencing variables
vi.mock('../../src/worker/middleware/auth', () => ({
  authMiddleware: vi.fn().mockImplementation(async (c: any, next: any) => {
    // Set user context as the middleware would do
    c.set('user', { 
      id: 'user-123', 
      email: 'test@example.com',
      role: 'USER',
      entityId: 'entity-123'
    });
    // CRITICAL: Must await next() and return the result to continue the middleware chain properly
    return await next();
  }),
}));

// Create a comprehensive database mock that matches Drizzle ORM interface
const createMockDatabase = () => {
  // Helper function to create a chainable mock with leftJoin support
  const createQueryChain = (finalResult: any[] = []) => {
    const chain = {
      select: vi.fn(() => createQueryChain(finalResult)),
      from: vi.fn(() => createQueryChain(finalResult)),
      where: vi.fn(() => createQueryChain(finalResult)),
      orderBy: vi.fn(() => createQueryChain(finalResult)),
      limit: vi.fn(() => createQueryChain(finalResult)),
      offset: vi.fn(() => createQueryChain(finalResult)),
      leftJoin: vi.fn(() => createQueryChain(finalResult)),
      rightJoin: vi.fn(() => createQueryChain(finalResult)),
      innerJoin: vi.fn(() => createQueryChain(finalResult)),
      values: vi.fn(() => createQueryChain(finalResult)),
      set: vi.fn(() => createQueryChain(finalResult)),
      returning: vi.fn(() => Promise.resolve(finalResult)),
      insert: vi.fn(() => createQueryChain(finalResult)),
      update: vi.fn(() => createQueryChain(finalResult)),
      delete: vi.fn(() => createQueryChain(finalResult)),
      catch: vi.fn(),
      finally: vi.fn(),
    };
    
    return chain;
  };

  return {
    select: vi.fn(() => createQueryChain()),
    insert: vi.fn(() => createQueryChain()),
    update: vi.fn(() => createQueryChain()),
    delete: vi.fn(() => createQueryChain()),
  };
};

// Mock database operations  
vi.mock('../../src/db/index', () => {
  return {
    createDatabase: vi.fn(() => createMockDatabase()),
    // Export all schema objects that the router imports
    budgets: {
      id: 'budgets.id',
      budgetPeriodId: 'budgets.budgetPeriodId',
      categoryId: 'budgets.categoryId',
      name: 'budgets.name',
      description: 'budgets.description',
      plannedAmount: 'budgets.plannedAmount',
      actualAmount: 'budgets.actualAmount',
      currency: 'budgets.currency',
      status: 'budgets.status',
      approvalRequired: 'budgets.approvalRequired',
      tags: 'budgets.tags',
      metadata: 'budgets.metadata',
      budgetType: 'budgets.budgetType',
      notes: 'budgets.notes',
      createdBy: 'budgets.createdBy',
      createdAt: 'budgets.createdAt',
      updatedAt: 'budgets.updatedAt',
    },
    budgetPeriods: {
      id: 'budgetPeriods.id',
      name: 'budgetPeriods.name',
      description: 'budgetPeriods.description',
      startDate: 'budgetPeriods.startDate',
      endDate: 'budgetPeriods.endDate',
      status: 'budgetPeriods.status',
      currency: 'budgetPeriods.currency',
      totalPlanned: 'budgetPeriods.totalPlanned',
      totalActual: 'budgetPeriods.totalActual',
      createdBy: 'budgetPeriods.createdBy',
      entityId: 'budgetPeriods.entityId',
      createdAt: 'budgetPeriods.createdAt',
      updatedAt: 'budgetPeriods.updatedAt',
    },
    categories: {
      id: 'categories.id',
      name: 'categories.name',
      description: 'categories.description',
      categoryType: 'categories.categoryType',
      parentCategoryId: 'categories.parentCategoryId',
      entityId: 'categories.entityId',
      isActive: 'categories.isActive',
      displayOrder: 'categories.displayOrder',
      metadata: 'categories.metadata',
      createdAt: 'categories.createdAt',
      updatedAt: 'categories.updatedAt',
    },
    budgetAllocations: {
      id: 'budgetAllocations.id',
      budgetId: 'budgetAllocations.budgetId',
      categoryId: 'budgetAllocations.categoryId',
      amount: 'budgetAllocations.amount',
      currency: 'budgetAllocations.currency',
      notes: 'budgetAllocations.notes',
      createdAt: 'budgetAllocations.createdAt',
      updatedAt: 'budgetAllocations.updatedAt',
    },
    budgetRevisions: {
      id: 'budgetRevisions.id',
      budgetId: 'budgetRevisions.budgetId',
      revisionNumber: 'budgetRevisions.revisionNumber',
      changes: 'budgetRevisions.changes',
      reason: 'budgetRevisions.reason',
      approvedBy: 'budgetRevisions.approvedBy',
      approvedAt: 'budgetRevisions.approvedAt',
      createdBy: 'budgetRevisions.createdBy',
      createdAt: 'budgetRevisions.createdAt',
    },
  };
});

// Mock schema
vi.mock('../../src/db/schema', () => ({
  budgets: { id: 'budgets.id' },
  budgetPeriods: { id: 'budgetPeriods.id' },
  categories: { id: 'categories.id' },
  budgetAllocations: { id: 'budgetAllocations.id' },
  budgetRevisions: { id: 'budgetRevisions.id' },
  users: { id: 'users.id' },
}));

// Mock Drizzle ORM operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ column: col, value: val, operator: 'eq' })),
  and: vi.fn((...conditions) => ({ operator: 'and', conditions })),
  or: vi.fn((...conditions) => ({ operator: 'or', conditions })),
  desc: vi.fn((col) => ({ column: col, direction: 'desc' })),
  asc: vi.fn((col) => ({ column: col, direction: 'asc' })),
}));

// Import router after mocks
import budgetsRouter from '../../src/worker/routes/api/budgets';
import { createDatabase } from '../../src/db/index';

describe('Budgets API Routes', () => {
  let app: Hono<AppContext>;
  let env: any;
  let ctx: any;
  let mockDb: any;
  let consoleErrorSpy: any;

  // Mock data for testing
  const mockBudgetPeriod = {
    id: 1,
    name: 'Q1 2024',
    description: 'First quarter budget',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-03-31T00:00:00.000Z',
    status: 'ACTIVE',
    totalPlanned: 100000,
    totalActual: 0,
    currency: 'USD',
    entityId: 'entity-123',
    createdBy: 'user-123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockCategory = {
    id: 1,
    name: 'Marketing',
    description: 'Marketing and advertising expenses',
    categoryType: 'EXPENSE',
    parentCategoryId: null,
    displayOrder: 1,
    isActive: true,
    entityId: 'entity-123',
    metadata: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockBudget = {
    id: 1,
    budgetPeriodId: 1,
    categoryId: 1,
    name: 'Marketing Budget',
    description: 'Quarterly marketing expenses',
    plannedAmount: 50000,
    actualAmount: 0,
    currency: 'USD',
    status: 'ACTIVE',
    budgetType: 'OPERATIONAL',
    approvalRequired: false,
    metadata: null,
    tags: JSON.stringify(['marketing', 'advertising']),
    notes: 'Initial marketing budget for Q1',
    createdBy: 'user-123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console.error to suppress expected error messages during tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create fresh database mock for each test
    mockDb = createMockDatabase();
    
    // Mock createDatabase to return our mock
    (createDatabase as any).mockReturnValue(mockDb);

    // Setup environment with all required properties
    env = {
      FINANCE_MANAGER_CACHE: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue({ keys: [] }),
      },
      FINANCE_MANAGER_DB: mockDb,
      JWT_SECRET: 'test-secret-key-for-testing',
    } as any;

    ctx = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    } as any;

    // Create fresh app for each test
    app = new Hono<AppContext>();
    app.route('/api/budgets', budgetsRouter);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('GET /api/budgets', () => {
    it('should return list of budgets', async () => {
      // Set up the response to be returned at the end of the chain
      const mockResult = [{ budget: mockBudget, period: mockBudgetPeriod, category: mockCategory }];
      
      // Create database mock that returns our test data
      mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            leftJoin: vi.fn(() => ({
              leftJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() => Promise.resolve(mockResult))
                })),
                orderBy: vi.fn(() => Promise.resolve(mockResult))
              }))
            }))
          }))
        })),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const response = await app.request(
        '/api/budgets',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-jwt-token',
          },
        },
        env,
        ctx
      );

      expect(response.status).toBe(200);
      
      const data = await response.json() as { success: boolean; data: any };
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockResult);
    });

    it('should handle empty budget list', async () => {
      // Mock database to return empty array
      mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            leftJoin: vi.fn(() => ({
              leftJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() => Promise.resolve([]))
                })),
                orderBy: vi.fn(() => Promise.resolve([]))
              }))
            }))
          }))
        })),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const response = await app.request(
        '/api/budgets',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-jwt-token',
          },
        },
        env,
        ctx
      );

      expect(response.status).toBe(200);
      
      const data = await response.json() as { success: boolean; data: any };
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });

  describe('GET /api/budgets/:id', () => {
    it('should return specific budget', async () => {
      const mockResult = [{ budget: mockBudget, period: mockBudgetPeriod, category: mockCategory }];
      const mockAllocations: any[] = [];
      const mockRevisions: any[] = [];
      
      // Mock database to handle all three queries in the GET by ID endpoint
      let callCount = 0;
      mockDb = {
        select: vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            // First call: main budget query with leftJoins and where
            return {
              from: vi.fn(() => ({
                leftJoin: vi.fn(() => ({
                  leftJoin: vi.fn(() => ({
                    where: vi.fn(() => Promise.resolve(mockResult))
                  }))
                }))
              }))
            };
          } else if (callCount === 2) {
            // Second call: allocations query
            return {
              from: vi.fn(() => ({
                leftJoin: vi.fn(() => ({
                  where: vi.fn(() => ({
                    orderBy: vi.fn(() => Promise.resolve(mockAllocations))
                  }))
                }))
              }))
            };
          } else {
            // Third call: revisions query
            return {
              from: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() => Promise.resolve(mockRevisions))
                }))
              }))
            };
          }
        }),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const response = await app.request(
        '/api/budgets/1',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-jwt-token',
          },
        },
        env,
        ctx
      );

      expect(response.status).toBe(200);
      
      const data = await response.json() as { success: boolean; data: any };
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('budget');
    });

    it('should return 404 for non-existent budget', async () => {
      // Mock database to return empty array
      mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            leftJoin: vi.fn(() => ({
              leftJoin: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([]))
              }))
            }))
          }))
        })),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const response = await app.request(
        '/api/budgets/999',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-jwt-token',
          },
        },
        env,
        ctx
      );

      expect(response.status).toBe(404);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Budget not found');
    });
  });

  describe('POST /api/budgets', () => {
    it('should create new budget', async () => {
      // Mock database that handles period check and budget insert
      mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([mockBudgetPeriod]))
          }))
        })),
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([mockBudget]))
          }))
        })),
        update: vi.fn(),
        delete: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const newBudget = {
        periodId: 1,
        categoryId: 1,
        name: 'Test Budget',
        description: 'Test budget description',
        totalAmount: 50000,
        currency: 'USD',
      };

      const response = await app.request(
        '/api/budgets',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-jwt-token',
          },
          body: JSON.stringify(newBudget),
        },
        env,
        ctx
      );

      expect(response.status).toBe(201);
      
      const data = await response.json() as { success: boolean; data: any };
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
    });

    it('should reject budget with missing required fields', async () => {
      const invalidBudget = {
        name: 'Test Budget',
        // Missing required fields like periodId and totalAmount
      };

      const response = await app.request(
        '/api/budgets',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-jwt-token',
          },
          body: JSON.stringify(invalidBudget),
        },
        env,
        ctx
      );

      expect(response.status).toBe(400);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Valid period ID is required');
    });

    it('should reject budget with non-existent budget period', async () => {
      // Mock budget period not found
      mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([]))
          }))
        })),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const newBudget = {
        periodId: 999,
        categoryId: 1,
        name: 'Test Budget',
        description: 'Test budget description',
        totalAmount: 50000,
        currency: 'USD',
      };

      const response = await app.request(
        '/api/budgets',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-jwt-token',
          },
          body: JSON.stringify(newBudget),
        },
        env,
        ctx
      );

      expect(response.status).toBe(400);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Budget period not found');
    });
  });

  describe('PUT /api/budgets/:id', () => {
    it('should update existing budget', async () => {
      // Mock existing budget found and update operations
      mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([mockBudget]))
          }))
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn(() => Promise.resolve([{ ...mockBudget, name: 'Updated Budget' }]))
            }))
          }))
        })),
        insert: vi.fn(),
        delete: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const updateData = {
        name: 'Updated Budget',
        description: 'Updated description',
      };

      const response = await app.request(
        '/api/budgets/1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-jwt-token',
          },
          body: JSON.stringify(updateData),
        },
        env,
        ctx
      );

      expect(response.status).toBe(200);
      
      const data = await response.json() as { success: boolean; data: any };
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
    });

    it('should return 404 for non-existent budget', async () => {
      // Mock budget not found
      mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([]))
          }))
        })),
        update: vi.fn(),
        insert: vi.fn(),
        delete: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const updateData = {
        name: 'Updated Budget',
      };

      const response = await app.request(
        '/api/budgets/999',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-jwt-token',
          },
          body: JSON.stringify(updateData),
        },
        env,
        ctx
      );

      expect(response.status).toBe(404);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Budget not found');
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    it('should delete existing budget', async () => {
      // Mock existing budget found and delete operations
      mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([mockBudget]))
          }))
        })),
        delete: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([mockBudget]))
          }))
        })),
        insert: vi.fn(),
        update: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const response = await app.request(
        '/api/budgets/1',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-jwt-token',
          },
        },
        env,
        ctx
      );

      expect(response.status).toBe(200);
      
      const data = await response.json() as { success: boolean; message: string };
      expect(data.success).toBe(true);
      expect(data.message).toBe('Budget deleted successfully');
    });

    it('should return 404 for non-existent budget', async () => {
      // Mock budget not found
      mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([]))
          }))
        })),
        delete: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const response = await app.request(
        '/api/budgets/999',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-jwt-token',
          },
        },
        env,
        ctx
      );

      expect(response.status).toBe(404);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Budget not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database to throw error
      mockDb = {
        select: vi.fn(() => {
          throw new Error('Database connection failed');
        }),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      
      (createDatabase as any).mockReturnValue(mockDb);

      const response = await app.request(
        '/api/budgets',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-jwt-token',
          },
        },
        env,
        ctx
      );

      expect(response.status).toBe(500);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch budgets');
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await app.request(
        '/api/budgets',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-jwt-token',
          },
          body: 'invalid json',
        },
        env,
        ctx
      );

      expect(response.status).toBe(500);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create budget');
    });
  });
});