/**
 * Test Configuration Utilities
 * 
 * This module provides comprehensive test configuration helpers following
 * the latest Drizzle ORM testing best practices from Context7 documentation.
 */

import { vi, type MockedFunction } from 'vitest';
import type { Database } from '../../src/db/index';

/**
 * Test environment configuration
 */
export const testConfig = {
  database: {
    url: 'file:./test.db',
    maxConnections: 1,
    timeout: 30000,
  },
  auth: {
    jwtSecret: 'test-secret-key-for-testing',
    tokenExpiry: '1h',
    sessionExpiry: '24h',
  },
  workers: {
    singleWorker: true,
    compatibilityDate: '2024-01-01',
    compatibilityFlags: ['nodejs_compat'],
  },
} as const;

/**
 * Environment variables for testing
 */
export const testEnvVars = {
  NODE_ENV: 'test',
  JWT_SECRET: testConfig.auth.jwtSecret,
  DATABASE_URL: testConfig.database.url,
} as const;

/**
 * Mock Cloudflare Workers environment
 */
export interface MockWorkerEnv {
  FINANCE_MANAGER_DB: D1Database;
  JWT_SECRET: string;
  FINANCE_MANAGER_CACHE: KVNamespace;
}

/**
 * Creates a mock Cloudflare Workers environment
 */
export function createMockWorkerEnv(): MockWorkerEnv {
  return {
    FINANCE_MANAGER_DB: {} as D1Database,
    JWT_SECRET: testConfig.auth.jwtSecret,
    FINANCE_MANAGER_CACHE: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue({ keys: [] }),
    } as any,
  };
}

/**
 * Database test utilities
 */
export class DatabaseTestUtils {
  private static mockDb: Database | null = null;

  /**
   * Get or create mock database instance
   */
  static getMockDatabase(): Database {
    if (!this.mockDb) {
      // Create a mock database instance
      this.mockDb = {} as Database;
    }
    return this.mockDb;
  }

  /**
   * Reset mock database state
   */
  static resetMockDatabase(): void {
    this.mockDb = null;
  }

  /**
   * Mock database query results
   */
  static mockQuery<T = any>(
    db: Database,
    method: 'select' | 'insert' | 'update' | 'delete',
    result: T[] | T | null = []
  ): MockedFunction<any> {
    const mockFn = vi.fn();
    
    switch (method) {
      case 'select':
        vi.spyOn(db, 'select').mockImplementation(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue(result),
        }) as any);
        break;

      case 'insert':
        vi.spyOn(db, 'insert').mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue(result),
          onConflictDoUpdate: vi.fn().mockReturnThis(),
          onConflictDoNothing: vi.fn().mockReturnThis(),
        }) as any);
        break;

      case 'update':
        vi.spyOn(db, 'update').mockImplementation(() => ({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue(result),
        }) as any);
        break;

      case 'delete':
        vi.spyOn(db, 'delete').mockImplementation(() => ({
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue(result),
        }) as any);
        break;
    }

    return mockFn;
  }

  /**
   * Mock database error
   */
  static mockError(
    db: Database,
    method: 'select' | 'insert' | 'update' | 'delete',
    error: Error = new Error('Database error')
  ): void {
    vi.spyOn(db, method).mockImplementation(() => {
      throw error;
    });
  }

  /**
   * Mock transaction
   */
  static mockTransaction<T>(
    db: Database,
    result?: T
  ): MockedFunction<any> {
    const mockTx = this.getMockDatabase();
    return vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => {
      if (result !== undefined) {
        return result;
      }
      return cb(mockTx);
    }) as any;
  }
}

/**
 * Authentication test utilities
 */
export class AuthTestUtils {
  /**
   * Mock JWT functions
   */
  static mockJWT() {
    vi.mock('hono/jwt', () => ({
      sign: vi.fn().mockResolvedValue('mock-jwt-token'),
      verify: vi.fn().mockResolvedValue({ 
        payload: { 
          userId: 'user-123', 
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600
        } 
      }),
      decode: vi.fn().mockReturnValue({ 
        header: { typ: 'JWT', alg: 'HS256' },
        payload: { userId: 'user-123', email: 'test@example.com' }
      }),
    }));
  }

  /**
   * Mock password utilities
   */
  static mockPasswordUtils() {
    vi.mock('../../src/lib/auth/password', () => ({
      hashPassword: vi.fn().mockResolvedValue({
        hash: 'mocked-hash-hex',
        salt: 'mocked-salt-hex',
        combined: 'mocked-hash-hex:mocked-salt-hex',
        config: { iterations: 10000, keyLength: 32 },
      }),
      verifyPassword: vi.fn().mockResolvedValue(true),
      validatePassword: vi.fn().mockReturnValue({
        isValid: true,
        errors: [],
        score: 100,
      }),
      DEFAULT_PBKDF2_CONFIG: { iterations: 10000, keyLength: 32 },
    }));
  }

  /**
   * Mock crypto utilities
   */
  static mockCrypto() {
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
          encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
          decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        },
        randomUUID: vi.fn().mockReturnValue('mock-uuid-' + Math.random()),
        getRandomValues: vi.fn().mockImplementation((arr) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        }),
      },
    });
  }
}

/**
 * API test utilities
 */
export class APITestUtils {
  /**
   * Create test request headers
   */
  static createHeaders(options: {
    contentType?: string;
    authorization?: string;
    userAgent?: string;
    [key: string]: string | undefined;
  } = {}): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (options.contentType) {
      headers['Content-Type'] = options.contentType;
    }
    
    if (options.authorization) {
      headers['Authorization'] = options.authorization;
    }
    
    if (options.userAgent) {
      headers['User-Agent'] = options.userAgent;
    }
    
    // Add any additional headers
    Object.entries(options).forEach(([key, value]) => {
      if (value && !['contentType', 'authorization', 'userAgent'].includes(key)) {
        headers[key] = value;
      }
    });
    
    return headers;
  }

  /**
   * Create test request with common defaults
   */
  static createRequest(
    url: string,
    method: string = 'GET',
    options: {
      body?: any;
      headers?: Record<string, string>;
      auth?: boolean;
    } = {}
  ): RequestInit & { url: string } {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.auth) {
      headers['Authorization'] = 'Bearer mock-jwt-token';
    }

    const request: RequestInit & { url: string } = {
      url,
      method,
      headers,
    };

    if (options.body) {
      request.body = JSON.stringify(options.body);
    }

    return request;
  }
}

/**
 * Test lifecycle utilities
 */
export class TestLifecycleUtils {
  /**
   * Setup test environment
   */
  static setupTestEnvironment() {
    // Set environment variables
    Object.entries(testEnvVars).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });

    // Setup crypto mocks
    AuthTestUtils.mockCrypto();
    
    // Setup JWT mocks
    AuthTestUtils.mockJWT();
    
    // Setup password mocks
    AuthTestUtils.mockPasswordUtils();
  }

  /**
   * Cleanup test environment
   */
  static cleanupTestEnvironment() {
    // Reset database
    DatabaseTestUtils.resetMockDatabase();
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset modules
    vi.resetModules();
  }

  /**
   * Full test reset
   */
  static resetTest() {
    this.cleanupTestEnvironment();
    this.setupTestEnvironment();
  }
}

/**
 * Performance test utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time
   */
  static async measureTime<T>(
    fn: () => Promise<T>,
    name: string = 'operation'
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  }

  /**
   * Test with timeout
   */
  static async withTimeout<T>(
    fn: () => Promise<T>,
    timeout: number = 30000
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
      }),
    ]);
  }
}

// Export all utilities
export {
  DatabaseTestUtils as DB,
  AuthTestUtils as Auth,
  APITestUtils as API,
  TestLifecycleUtils as Lifecycle,
  PerformanceTestUtils as Performance,
};