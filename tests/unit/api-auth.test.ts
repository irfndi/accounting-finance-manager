/**
 * Auth API Unit Tests
 *
 * This test suite covers the authentication routes, including registration,
 * login, logout, and session management. It uses mocked database operations
 * for reliable and fast testing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock dependencies BEFORE importing any modules
vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('mock-jwt-token'),
  verify: vi.fn().mockImplementation(async (token: string) => {
    if (token === 'mock-refresh-token' || token === 'mock-jwt-token') {
      return { id: 'user-123', email: 'test@example.com', role: 'USER' };
    }
    throw new Error('Invalid token');
  }),
}));

vi.mock('../../src/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue({
    hash: 'mock-hash',
    salt: 'mock-salt',
    combined: 'mock-salt:mock-hash',
    config: { iterations: 100000, keyLength: 32, hash: 'SHA-256', saltLength: 16 }
  }),
  verifyPassword: vi.fn().mockResolvedValue(true),
  validatePassword: vi.fn().mockReturnValue({
    isValid: true,
    errors: [],
    score: 85
  }),
}));

// Mock auth middleware
vi.mock('../../src/worker/middleware/auth', () => ({
  authMiddleware: vi.fn().mockImplementation(async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Simulate JWT verification with our mock logic
      if (token === 'mock-refresh-token' || token === 'mock-jwt-token') {
        const decodedPayload = { id: 'user-123', email: 'test@example.com', role: 'USER' };
        
        // Mock user for authenticated requests
        c.set('user', { id: 'user-123', email: 'test@example.com' });
        c.set('jwtPayload', decodedPayload);
        await next();
      } else {
        return c.json({ error: 'Unauthorized' }, 401);
      }
    } catch {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }),
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn().mockImplementation((column, value) => {
    return { column, value, operator: 'eq' };
  }),
}));

// Mock database schema
vi.mock('../../src/db/schema', () => ({
  users: {
    id: 'users.id',
    email: 'users.email',
    passwordHash: 'users.passwordHash',
    role: 'users.role',
    entityId: 'users.entityId',
    emailVerified: 'users.emailVerified',
    isActive: 'users.isActive',
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
}));

// Create a proper chainable mock that supports all Drizzle methods
function createQueryMock(returnValue: any = []) {
  const mockResult = Array.isArray(returnValue) ? returnValue : [returnValue];
  
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(mockResult),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    rightJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(mockResult),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
  
  return chain;
}

// Mock database operations
let mockDb: any;

vi.mock('../../src/db/index', () => ({
  createDatabase: vi.fn(() => mockDb),
  // Schema objects that the router imports  
  users: {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    displayName: 'displayName',
    emailVerified: 'emailVerified',
    createdAt: 'createdAt',
    lastLoginAt: 'lastLoginAt',
    updatedAt: 'updatedAt',
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
  eq: vi.fn().mockImplementation((column, value) => {
    return { column, value, operator: 'eq' };
  }),
}));

// Import modules after setting up mocks
import authRouter from '../../src/worker/routes/api/auth.js';
import * as passwordUtils from '../../src/lib/auth/password';
import * as jwtUtils from 'hono/jwt';

// Mock user object
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  passwordHash: 'mock-salt:mock-hash',
  role: 'USER' as const,
  entityId: 'entity-123',
  emailVerified: true,
  isActive: true,
  displayName: 'Test User',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  lastLoginAt: null,
  metadata: null,
};

describe('Auth API Routes', () => {
  let app: Hono<AppContext>;
  let env: any;
  let ctx: any;

  beforeEach(() => {
    // Reset mock implementations
    vi.clearAllMocks();
    
    // Create comprehensive database mock
    mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue(createQueryMock([])),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
      delete: vi.fn(),
    };

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
      AUTH_SESSION_DURATION: '7d',
    } as any;

    ctx = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    } as any;

    // Reset the app for each test
    app = new Hono<AppContext>();
    app.route('/api/auth', authRouter);

    // Reset password and jwt mocks
    (passwordUtils.hashPassword as any).mockResolvedValue({
      hash: 'mock-hash',
      salt: 'mock-salt',
      combined: 'mock-salt:mock-hash',
      config: { iterations: 100000, keyLength: 32, hash: 'SHA-256', saltLength: 16 }
    });
    (passwordUtils.verifyPassword as any).mockResolvedValue(true);
    (jwtUtils.sign as any).mockResolvedValue('mock-jwt-token');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock database operations for registration
      mockDb.select = vi.fn().mockReturnValue(createQueryMock([])); // No existing user
      mockDb.insert = vi.fn().mockReturnValue(createQueryMock([mockUser]));

      const response = await app.request(
        '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'SecurePassword123!',
            name: 'Test User'
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(201);
      
      const data = await response.json() as { success: boolean; user: any; token?: string };
      expect(data.success).toBe(true);
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email');
      expect(data).toHaveProperty('token');
    });

    it('should reject registration with missing email', async () => {
      const response = await app.request(
        '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: 'SecurePassword123!',
            name: 'Test User'
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(400);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    it('should reject registration with existing user', async () => {
      // Mock database to return existing user
      mockDb.select = vi.fn().mockReturnValue(createQueryMock([mockUser]));

      const response = await app.request(
        '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'SecurePassword123!',
            name: 'Test User'
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(409);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('User already exists');
    });

    it('should reject registration with invalid email', async () => {
      const response = await app.request(
        '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'invalid-email',
            password: 'SecurePassword123!',
            name: 'Test User'
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(400);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email format');
    });

    it('should reject registration with weak password', async () => {
      // Mock password validation to fail
      (passwordUtils.validatePassword as any).mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters long'],
        score: 20
      });

      const response = await app.request(
        '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'weak',
            name: 'Test User'
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(400);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Password requirements not met');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      // Mock database to return existing user
      mockDb.select = vi.fn().mockReturnValue(createQueryMock([mockUser]));
      mockDb.update = vi.fn().mockReturnValue(createQueryMock([mockUser]));

      const response = await app.request(
        '/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'SecurePassword123!'
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(200);
      
      const data = await response.json() as { success: boolean; user: any; token?: string };
      expect(data.success).toBe(true);
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email');
      expect(data).toHaveProperty('token');
    });

    it('should reject login with invalid email', async () => {
      // Mock database to return no user
      mockDb.select = vi.fn().mockReturnValue(createQueryMock([]));

      const response = await app.request(
        '/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: 'SecurePassword123!'
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(401);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should reject login with incorrect password', async () => {
      // Mock database to return existing user
      mockDb.select = vi.fn().mockReturnValue(createQueryMock([mockUser]));
      // Mock password verification to fail
      (passwordUtils.verifyPassword as any).mockResolvedValue(false);

      const response = await app.request(
        '/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'WrongPassword123!'
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(401);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should reject login with missing credentials', async () => {
      const response = await app.request(
        '/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com'
            // Missing password
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(400);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing credentials');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully with valid session', async () => {
      // Mock database to return user when queried
      mockDb.select = vi.fn().mockReturnValue(createQueryMock([mockUser]));

      const response = await app.request(
        '/api/auth/refresh',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: 'mock-refresh-token'
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(200);
      
      const data = await response.json() as { success: boolean; token?: string };
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('token');
    });

    it('should reject refresh with invalid session', async () => {
      const response = await app.request(
        '/api/auth/refresh',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: 'invalid-token'
          }),
        },
        env,
        ctx
      );

      expect(response.status).toBe(401);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or expired refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await app.request(
        '/api/auth/logout',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-jwt-token',
            'Content-Type': 'application/json',
          },
        },
        env,
        ctx
      );

      expect(response.status).toBe(200);
      
      const data = await response.json() as { success: boolean; message: string };
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logged out successfully');
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle missing JWT_SECRET', async () => {
      const envWithoutJWT = { ...env };
      delete envWithoutJWT.JWT_SECRET;

      const response = await app.request(
        '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'SecurePassword123!',
            name: 'Test User'
          }),
        },
        envWithoutJWT,
        ctx
      );

      expect(response.status).toBe(500);
      
      const data = await response.json() as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toBe('Server configuration error');
    });
  });
});