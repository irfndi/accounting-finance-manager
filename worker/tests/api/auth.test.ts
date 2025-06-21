import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../../src/index';
import * as argon2 from 'argon2';
import { sign } from 'hono/jwt';

// Mock the @finance-manager/core module
vi.mock('@finance-manager/core', () => ({
  validateEmail: vi.fn((email: string) => {
    return email.includes('@') && email.includes('.');
  }),
  validatePassword: vi.fn((password: string) => {
    return password.length >= 8;
  })
}));

// Test utilities
function createTestRequest(method: string, path: string, body?: any, headers?: Record<string, string>) {
  const url = `http://localhost${path}`;
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    init.body = JSON.stringify(body);
  }
  
  return new Request(url, init);
}

function createAuthenticatedRequest(method: string, path: string, token: string, body?: any) {
  return createTestRequest(method, path, body, {
    'Authorization': `Bearer ${token}`,
  });
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Invalid JSON response', body: text };
  }
}

async function createTestJWTToken(payload: any, secret: string) {
  return await sign(payload, secret);
}

// Helper function to create authenticated test user with session and database record
async function createAuthenticatedTestUser(userId: string, email: string, name: string): Promise<string> {
  // Import database utilities
  const { createDatabase } = await import('@finance-manager/db');
  const { users } = await import('@finance-manager/db');
  
  // Create database record
  const db = createDatabase(env.FINANCE_MANAGER_DB);
  const hashedPassword = await hashPassword('testpassword123');
  
  try {
    await db.insert(users).values({
      id: userId,
      email: email,
      emailVerified: false,
      passwordHash: hashedPassword,
      firstName: null,
      lastName: null,
      displayName: name,
      timezone: 'UTC',
      locale: 'en',
      isActive: true,
      isVerified: false,
      role: 'USER',
      permissions: null,
      entityId: null,
      entityAccess: null,
      lastLoginAt: null,
      lastLoginIp: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
      createdBy: null,
      updatedBy: null
    });
  } catch (error) {
    // User might already exist, ignore error
  }

  const token = await createTestJWTToken({
    id: userId,
    email: email,
    name: name,
    exp: Math.floor(Date.now() / 1000) + 3600
  }, env.JWT_SECRET);

  // Create session in KV cache
  const sessionKey = `session:${userId}`;
  await env.FINANCE_MANAGER_CACHE.put(sessionKey, JSON.stringify({
    userId: userId,
    email: email,
    name: name,
    createdAt: new Date().toISOString(),
  }), { expirationTtl: 7 * 24 * 60 * 60 });

  return token;
}

// Helper function for password hashing (same as in auth.ts)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

describe('Authentication API', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User'
      };

      const request = createTestRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(201);
      
      const result = await parseJsonResponse(response);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.passwordHash).toBeUndefined();
      expect(result.token).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'testpassword123',
        name: 'Test User'
      };

      const request = createTestRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(400);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Invalid email format');
    });

    it('should reject weak passwords', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Too weak
        name: 'Test User'
      };

      const request = createTestRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(400);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Password must be at least');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'testpassword123',
        name: 'Test User'
      };

      // First registration should succeed
      const firstRequest = createTestRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const firstCtx = createExecutionContext();
      const firstResponse = await worker.fetch(firstRequest, env, firstCtx);
      await waitOnExecutionContext(firstCtx);
      
      expect(firstResponse.status).toBe(201);

      // Second registration with same email should fail
      const secondRequest = createTestRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const secondCtx = createExecutionContext();
      const secondResponse = await worker.fetch(secondRequest, env, secondCtx);
      await waitOnExecutionContext(secondCtx);
      
      if (secondResponse.status !== 409) {
        const errorResult = await parseJsonResponse(secondResponse);
        throw new Error(`Duplicate registration test failed: status ${secondResponse.status}, error: ${JSON.stringify(errorResult)}`);
      }
      expect(secondResponse.status).toBe(409);
      
      const result = await parseJsonResponse(secondResponse);
      expect(result.error).toContain('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      const request = createTestRequest(
        'POST',
        '/api/auth/login',
        loginData
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      if (response.status !== 200) {
        const errorResult = await parseJsonResponse(response);
        throw new Error(`Login test failed: status ${response.status}, error: ${JSON.stringify(errorResult)}`);
      }
      if (response.status !== 200) {
        const errorBody = await response.text();
        throw new Error(`Expected 200 but got ${response.status}. Error: ${errorBody}`);
      }

      const result = await parseJsonResponse(response);
      expect(result.message).toBe('Login successful');
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.user.passwordHash).toBeUndefined();
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const request = createTestRequest(
        'POST',
        '/api/auth/login',
        loginData
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(401);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Invalid credentials');
    });

    it('should require email and password', async () => {
      const loginData = {
        email: 'test@example.com'
        // Missing password
      };

      const request = createTestRequest(
        'POST',
        '/api/auth/login',
        loginData
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(400);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Missing credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const userId = 'test-user-id';
      const token = await createAuthenticatedTestUser(userId, 'test@example.com', 'Test User');

      const request = createAuthenticatedRequest(
        'GET',
        '/api/auth/profile',
        token
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      if (response.status !== 200) {
        const errorBody = await response.text();
        throw new Error(`Expected 200 but got ${response.status}. Error: ${errorBody}`);
      }
      
      const result = await parseJsonResponse(response);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.passwordHash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const request = createTestRequest(
        'GET',
        '/api/auth/profile'
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(401);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Unauthorized');
    });

    it('should reject request with invalid token', async () => {
      const request = createAuthenticatedRequest(
        'GET',
        '/api/auth/profile',
        'invalid-token'
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(401);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'test-user-id';
      const token = await createAuthenticatedTestUser(userId, 'test@example.com', 'Test User');

      const updateData = {
        name: 'Updated Name'
      };

      const request = createAuthenticatedRequest(
        'PUT',
        '/api/auth/profile',
        token,
        updateData
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(200);
      
      const result = await parseJsonResponse(response);
      expect(result.user).toBeDefined();
      expect(result.user.name).toBe(updateData.name);
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should change password successfully', async () => {
      const userId = 'test-user-id';
      const token = await createAuthenticatedTestUser(userId, 'test@example.com', 'Test User');

      const passwordData = {
        currentPassword: 'testpassword123',
        newPassword: 'newpassword123'
      };

      const request = createAuthenticatedRequest(
        'PUT',
        '/api/auth/password',
        token,
        passwordData
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      if (response.status !== 200) {
        const errorBody = await response.text();
        throw new Error(`Expected 200 but got ${response.status}. Error: ${errorBody}`);
      }
      
      const result = await parseJsonResponse(response);
      expect(result.message).toContain('Password updated successfully');
    });
  });

  describe('GET /api/auth/validate', () => {
    it('should validate session successfully', async () => {
      const userId = 'test-user-id';
      const token = await createAuthenticatedTestUser(userId, 'test@example.com', 'Test User');

      const request = createAuthenticatedRequest(
        'GET',
        '/api/auth/validate',
        token
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(200);
      
      const result = await parseJsonResponse(response);
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const userId = 'test-user-id';
      const token = await createAuthenticatedTestUser(userId, 'test@example.com', 'Test User');

      const request = createAuthenticatedRequest(
        'POST',
        '/api/auth/logout',
        token
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(200);
      
      const result = await parseJsonResponse(response);
      expect(result.message).toContain('Logged out successfully');
    });

    it('should handle logout without token gracefully', async () => {
      const request = createTestRequest(
        'POST',
        '/api/auth/logout'
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      
      expect(response.status).toBe(200);
      
      const result = await parseJsonResponse(response);
      expect(result.message).toBe('Logged out');
    });
  });
});