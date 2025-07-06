/**
 * Database Test Helpers
 * Provides utilities for mocking database operations in tests
 */

import { vi } from 'vitest';
import * as schema from '../../src/db/schema';
import type { SelectUser, SelectSession } from '../../src/db/schema';


/**
 * Creates a mock that supports Drizzle ORM's chainable query pattern
 * This mock handles the complex chaining patterns like:
 * db.select().from(table).where(condition).orderBy(field).limit(10)
 */
export function createQueryMock(returnValue: any = []) {
  const mockResult = Array.isArray(returnValue) ? returnValue : [returnValue];
  
  const chain = {
    // Selection methods
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    
    // Ordering and pagination
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    
    // Join methods
    leftJoin: vi.fn().mockReturnThis(),
    rightJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    
    // Mutation methods
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    
    // Promise interface for async resolution
    catch: vi.fn(),
    finally: vi.fn(),
  };

  // Override the final resolution methods to return actual promises
  chain.returning = vi.fn().mockResolvedValue(mockResult);
  chain.limit = vi.fn().mockResolvedValue(mockResult);
  
  return chain;
}

/**
 * Creates a complete database mock with all standard operations
 */
export function createDatabaseMock() {
  return {
    select: vi.fn(() => createQueryMock([])),
    insert: vi.fn(() => createQueryMock([])),
    update: vi.fn(() => createQueryMock([])),
    delete: vi.fn(() => createQueryMock([])),
  };
}

/**
 * Creates mock schema objects for common database tables
 */
export const mockSchemas = {
  users: {
    id: 'users.id',
    email: 'users.email',
    passwordHash: 'users.passwordHash',
    role: 'users.role',
    entityId: 'users.entityId',
    emailVerified: 'users.emailVerified',
    isActive: 'users.isActive',
    firstName: 'users.firstName',
    lastName: 'users.lastName',
    displayName: 'users.displayName',
    createdAt: 'users.createdAt',
    updatedAt: 'users.updatedAt',
    lastLoginAt: 'users.lastLoginAt',
  },
  
  entities: {
    id: 'entities.id',
    name: 'entities.name',
    type: 'entities.type',
    description: 'entities.description',
    isActive: 'entities.isActive',
    createdBy: 'entities.createdBy',
    createdAt: 'entities.createdAt',
    updatedAt: 'entities.updatedAt',
  },
  
  budgets: {
    id: 'budgets.id',
    budgetPeriodId: 'budgets.budgetPeriodId',
    categoryId: 'budgets.categoryId',
    name: 'budgets.name',
    description: 'budgets.description',
    plannedAmount: 'budgets.plannedAmount',
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
    periodType: 'budgetPeriods.periodType',
    startDate: 'budgetPeriods.startDate',
    endDate: 'budgetPeriods.endDate',
    fiscalYear: 'budgetPeriods.fiscalYear',
    description: 'budgetPeriods.description',
    isActive: 'budgetPeriods.isActive',
    createdBy: 'budgetPeriods.createdBy',
    createdAt: 'budgetPeriods.createdAt',
    updatedAt: 'budgetPeriods.updatedAt',
  },
  
  categories: {
    id: 'categories.id',
    name: 'categories.name',
    description: 'categories.description',
    type: 'categories.type',
    isActive: 'categories.isActive',
    parentId: 'categories.parentId',
    createdBy: 'categories.createdBy',
    createdAt: 'categories.createdAt',
    updatedAt: 'categories.updatedAt',
  },
  
  budgetAllocations: {
    id: 'budgetAllocations.id',
    budgetId: 'budgetAllocations.budgetId',
    categoryId: 'budgetAllocations.categoryId',
    allocatedAmount: 'budgetAllocations.allocatedAmount',
    allocatedPercent: 'budgetAllocations.allocatedPercent',
    allocationType: 'budgetAllocations.allocationType',
    description: 'budgetAllocations.description',
    priority: 'budgetAllocations.priority',
    constraints: 'budgetAllocations.constraints',
    createdBy: 'budgetAllocations.createdBy',
    createdAt: 'budgetAllocations.createdAt',
    updatedAt: 'budgetAllocations.updatedAt',
  },
  
  budgetRevisions: {
    id: 'budgetRevisions.id',
    budgetId: 'budgetRevisions.budgetId',
    version: 'budgetRevisions.version',
    changes: 'budgetRevisions.changes',
    reason: 'budgetRevisions.reason',
    previousAmount: 'budgetRevisions.previousAmount',
    newAmount: 'budgetRevisions.newAmount',
    approvedBy: 'budgetRevisions.approvedBy',
    approvedAt: 'budgetRevisions.approvedAt',
    createdBy: 'budgetRevisions.createdBy',
    createdAt: 'budgetRevisions.createdAt',
  },
};

/**
 * Creates a complete mock environment for Workers tests
 */
export function createMockEnvironment(overrides: Record<string, any> = {}) {
  return {
    // Cloudflare Workers bindings
    ASSETS: {
      fetch: vi.fn().mockResolvedValue(new Response('mock asset', { status: 200 })),
    },
    AI: {
      run: vi.fn().mockResolvedValue({ response: 'mocked ai response' }),
    },
    FINANCE_MANAGER_CACHE: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    FINANCE_MANAGER_DOCUMENTS: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    FINANCE_MANAGER_DB: {},
    
    // Environment variables
    JWT_SECRET: 'test-secret-key-minimum-256-bits-long',
    ENVIRONMENT: 'test',
    AUTH_SESSION_DURATION: '7d',
    ENCRYPTION_KEY: 'test-encryption-key-32-characters',
    API_BASE_URL: 'https://test-api.example.com',
    ALLOWED_ORIGINS: 'http://localhost:3000,https://test.example.com',
    ...overrides,
  };
}

/**
 * Creates a mock execution context for Workers
 */
export function createMockContext() {
  return {
    executionCtx: {
      waitUntil: vi.fn(),
    },
  };
}

/**
 * Helper to create mock data for common entities
 */
export const mockData = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'mock-salt:mock-hash',
    role: 'USER',
    entityId: 'entity-123',
    emailVerified: true,
    isActive: true,
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  
  entity: {
    id: 'entity-123',
    name: 'Test Entity',
    type: 'COMPANY',
    description: 'Test company entity',
    isActive: true,
    createdBy: 'user-123',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  
  budgetPeriod: {
    id: 1,
    name: 'Q1 2024',
    periodType: 'quarterly',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    fiscalYear: 2024,
    description: 'First quarter budget period',
    isActive: true,
    createdBy: 'user-123',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  
  budget: {
    id: 1,
    budgetPeriodId: 1,
    categoryId: 1,
    name: 'Marketing Budget',
    description: 'Budget for marketing activities',
    plannedAmount: '50000.00',
    currency: 'USD',
    status: 'active',
    approvalRequired: true,
    tags: '["marketing", "advertising"]',
    metadata: '{"department": "marketing"}',
    budgetType: 'operational',
    notes: 'Annual marketing budget allocation',
    createdBy: 'user-123',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  
  category: {
    id: 1,
    name: 'Marketing',
    description: 'Marketing and advertising expenses',
    type: 'EXPENSE',
    isActive: true,
    parentId: null,
    createdBy: 'user-123',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
};

/**
 * Sets up common mock patterns for database queries
 */
export function setupDatabaseMocks(mockDb: ReturnType<typeof createDatabaseMock>) {
  // Default empty results
  mockDb.select = vi.fn(() => createQueryMock([]));
  mockDb.insert = vi.fn(() => createQueryMock([]));
  mockDb.update = vi.fn(() => createQueryMock([]));
  mockDb.delete = vi.fn(() => createQueryMock([]));
}

/**
 * Type definitions for test helpers
 */
export interface TestApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Creates a chainable mock with proper thenable support that handles multiple joins
 */
function createChainableMock(data: any[] = []): any {
  const chainable: any = {
    // Query building methods - each returns a new chainable mock
    select: vi.fn(() => createChainableMock(data)),
    from: vi.fn(() => createChainableMock(data)),
    where: vi.fn(() => createChainableMock(data)),
    orderBy: vi.fn(() => createChainableMock(data)),
    limit: vi.fn(() => createChainableMock(data)),
    offset: vi.fn(() => createChainableMock(data)),
    groupBy: vi.fn(() => createChainableMock(data)),
    having: vi.fn(() => createChainableMock(data)),
    
    // Join methods - always return new chainable to support chaining
    leftJoin: vi.fn(() => createChainableMock(data)),
    rightJoin: vi.fn(() => createChainableMock(data)),
    innerJoin: vi.fn(() => createChainableMock(data)),
    fullJoin: vi.fn(() => createChainableMock(data)),
    
    // Mutation methods
    insert: vi.fn(() => createChainableMock(data)),
    update: vi.fn(() => createChainableMock(data)),
    delete: vi.fn(() => createChainableMock(data)),
    values: vi.fn(() => createChainableMock(data)),
    set: vi.fn(() => createChainableMock(data)),
    returning: vi.fn(() => createChainableMock(data)),
    
    // Execution methods - return the actual data
    execute: vi.fn().mockResolvedValue(data),
    all: vi.fn().mockResolvedValue(data),
    get: vi.fn().mockResolvedValue(data[0] || null),
    run: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 1 }),
    
    // Promise interface methods
    catch: vi.fn((reject) => Promise.resolve(data).catch(reject)),
    finally: vi.fn((fn) => Promise.resolve(data).finally(fn)),
  };

  // Override specific methods to ensure proper chaining
  chainable.leftJoin = vi.fn(() => {
    const newChain = createChainableMock(data);
    // Ensure the new chain also supports multiple joins
    return newChain;
  });

  return chainable;
}

/**
 * Creates a comprehensive mock database instance for testing purposes.
 * This supports all Drizzle ORM chainable methods like leftJoin, orderBy, etc.
 *
 * @returns A mock database object with full query builder support.
 */
export async function createTestDatabase() {
  const mockData = {
    users: new Map<string, SelectUser>(),
    sessions: new Map<string, SelectSession>(),
    budgets: new Map<number, any>(),
    budgetPeriods: new Map<number, any>(),
    categories: new Map<number, any>(),
    transactions: new Map<number, any>(),
    budgetAllocations: new Map<number, any>(),
    budgetRevisions: new Map<number, any>(),
  };

  const mockDb = {
    // Table objects
    ...schema,
    
    // Core query methods
    select: vi.fn(() => createChainableMock([])),
    insert: vi.fn(() => createChainableMock([])),
    update: vi.fn(() => createChainableMock([])),
    delete: vi.fn(() => createChainableMock([])),
    
    // Transaction support
    transaction: vi.fn().mockImplementation((fn: any) => fn(mockDb)),
    
    // Raw query support
    run: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 1 }),
    all: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    
    // Schema access
    schema: schema,
    
    // Add any other database methods your app uses
    execute: vi.fn().mockResolvedValue([]),
  };

  return { mockDb, mockData };
}

/**
 * Sets up database mocks with specific return values for testing.
 * 
 * @param mockDb - The mock database instance
 * @param table - The table name to mock
 * @param data - The data to return from queries
 */
export function setupDatabaseMock(mockDb: any, table: string, data: any[]) {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Configure the main query builders to return chainable mocks with the specified data
  mockDb.select = vi.fn(() => createChainableMock(data));
  mockDb.insert = vi.fn(() => createChainableMock(data));
  mockDb.update = vi.fn(() => createChainableMock(data));
  mockDb.delete = vi.fn(() => createChainableMock(data));
}

/**
 * Creates mock environment bindings for testing
 */
export function createMockEnv() {
  return {
    FINANCE_MANAGER_DB: {},
    FINANCE_MANAGER_CACHE: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    FINANCE_MANAGER_DOCUMENTS: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    AI: {
      run: vi.fn().mockResolvedValue({ response: 'mocked ai response' }),
    },
    DOCUMENT_EMBEDDINGS: {
      query: vi.fn().mockResolvedValue({ matches: [] }),
      upsert: vi.fn().mockResolvedValue(undefined),
    },
    JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
    AUTH_SESSION_DURATION: '7d',
    ENCRYPTION_KEY: 'test-encryption-key-32-characters',
    ENVIRONMENT: 'test',
    API_BASE_URL: 'https://test-api.example.com',
    ALLOWED_ORIGINS: 'http://localhost:3000,https://test.example.com',
    DATABASE_URL: 'sqlite://memory',
    RATE_LIMIT_REQUESTS: '100',
    RATE_LIMIT_WINDOW: '900',
    SESSION_COOKIE_SECURE: 'false',
    SESSION_COOKIE_SAMESITE: 'lax',
    LOG_LEVEL: 'debug',
    SENTRY_DSN: '',
    ANALYTICS_ID: '',
  };
}

/**
 * Creates a mock auth middleware that adds a user to the context
 */
export function mockAuthMiddleware(user: any = null) {
  return vi.fn(async (c: any, next: any) => {
    if (user) {
      c.set('user', user);
    }
    await next();
  });
}

/**
 * Reset all mocks for clean test state
 */
export function resetMocks() {
  vi.clearAllMocks();
}

/**
 * Test Data Factories
 *
 * These factories generate mock data for testing purposes, ensuring consistency
 * and reusability across test suites. They provide default values that can be
 * overridden for specific test cases.
 */

/**
 * Creates a mock user object with sensible defaults.
 * @param overrides - An object with properties to override the default user data.
 * @returns A complete mock User object.
 */
export function createMockUser(overrides: Partial<SelectUser> = {}): SelectUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    ...overrides,
  };
}

/**
 * Creates a mock session object with sensible defaults.
 * @param overrides - An object with properties to override the default session data.
 * @returns A complete mock Session object.
 */
export function createMockSession(overrides: Partial<SelectSession> = {}): SelectSession {
  return {
    id: 'test-session-id',
    userId: 'test-user-id',
    ...overrides,
  };
}
