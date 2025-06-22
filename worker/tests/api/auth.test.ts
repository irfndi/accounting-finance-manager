import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../../src/index';
import { sign } from 'hono/jwt';
import type { Env } from '../../src/types';

// Mock KV storage for session management
const mockKVStorage = new Map<string, string>();
const mockKVCache = {
  get: vi.fn().mockImplementation((key: string, type?: string) => {
    const value = mockKVStorage.get(key);
    // KV GET operation logged
    if (type === 'json' && value) {
      try {
        return Promise.resolve(JSON.parse(value));
      } catch (e) {
        return Promise.resolve(null);
      }
    }
    return Promise.resolve(value || null);
  }),
  put: vi.fn().mockImplementation((key: string, value: string, options?: any) => {
    // KV PUT operation logged
    mockKVStorage.set(key, value);
    return Promise.resolve(undefined);
  }),
  delete: vi.fn().mockImplementation((key: string) => {
    // KV DELETE operation logged
    mockKVStorage.delete(key);
    return Promise.resolve(undefined);
  }),
  list: vi.fn().mockImplementation(() => {
    return Promise.resolve({ keys: [] });
  }),
  getWithMetadata: vi.fn().mockImplementation((key: string) => {
    const value = mockKVStorage.get(key);
    return Promise.resolve({
      value: value || null,
      metadata: null
    });
  })
};

// Mock environment for testing
const mockEnv: Env = {
  ENVIRONMENT: 'test',
  JWT_SECRET: 'test-jwt-secret-key-for-testing-purposes-only',
  AUTH_SESSION_DURATION: '7d',
  FINANCE_MANAGER_CACHE: mockKVCache,
  FINANCE_MANAGER_DOCUMENTS: {} as any,
  FINANCE_MANAGER_DB: {} as any,
  AI: {} as any,
  DOCUMENT_EMBEDDINGS: {} as any
};

// Mock the @finance-manager/core module
vi.mock('@finance-manager/core', () => ({
  validateEmail: vi.fn((email: string) => {
    return email.includes('@') && email.includes('.');
  }),
  validatePassword: vi.fn((password: string) => {
    return password.length >= 8;
  })
}));



// Mock database storage
const mockDbUsers = new Map<string, any>();

// Mock the database
vi.mock('@finance-manager/db', () => ({
  createDatabase: vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockImplementation((userData: any) => ({
        returning: vi.fn().mockImplementation(async () => {
          const user = {
            id: userData.id || crypto.randomUUID(),
            email: userData.email,
            passwordHash: userData.passwordHash,
            displayName: userData.displayName,
            emailVerified: userData.emailVerified || false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          mockDbUsers.set(user.email, user);
          return Promise.resolve([user]);
        })
      }))
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation((condition: any) => {
          // Handle eq(users.email, email) condition
          let email = null;
          
          // Check if condition has the structure we expect
          if (condition && typeof condition === 'object') {
            // Try to extract email from condition object properties
            if (condition.right) {
              email = condition.right;
            } else if (condition.value) {
              email = condition.value;
            } else {
              // Fallback: look for email-like strings in the condition
              const conditionStr = JSON.stringify(condition);
              const emailMatch = conditionStr.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
              email = emailMatch ? emailMatch[1] : null;
            }
          }
          
          if (email && mockDbUsers.has(email)) {
            const user = mockDbUsers.get(email);
            return Promise.resolve([user]);
          }
          return Promise.resolve([]);
        })
      })
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ 
          id: 'test-user-id'
        }])
      })
    })
  }),
  users: {},
  eq: vi.fn().mockImplementation((field: any, value: any) => {
    return `${field}=${value}`;
  })
}));

// Clear mock database before each test
beforeEach(() => {
  mockDbUsers.clear();
  mockKVStorage.clear();
  // Test setup: Cleared mock database and KV storage
});

// Test utilities
function createTestRequest(method: string, path: string, body?: any, headers?: Record<string, string>) {
  const url = `http://localhost${path}`;
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
  const token = await createTestJWTToken({
    id: userId,
    email: email,
    role: 'USER',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }, mockEnv.JWT_SECRET);

  // Mock session in KV cache
  const sessionKey = `session:${userId}`;
  await mockKVCache.put(sessionKey, JSON.stringify({
    userId: userId,
    email: email,
    name: name,
    createdAt: new Date().toISOString(),
  }));

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
  beforeEach(() => {
    vi.clearAllMocks();
    mockKVStorage.clear(); // Clear KV storage between tests
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'securepassword123',
        name: 'Test User'
      };

      const request = createTestRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await worker.fetch(request, mockEnv);
      
      expect(response.status).toBe(201);
      
      const result = await parseJsonResponse(response);
      expect(result.message).toContain('User registered successfully');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBeDefined();
    });

    it('should reject invalid email formats', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'securepassword123',
        name: 'Test User'
      };

      const request = createTestRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await worker.fetch(request, mockEnv);
      
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

      const response = await worker.fetch(request, mockEnv);
      
      expect(response.status).toBe(400);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Password must be at least');
    });

    it('should prevent duplicate user registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'securepassword123',
        name: 'Test User'
      };

      // First registration
      const firstRequest = createTestRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const firstResponse = await worker.fetch(firstRequest, mockEnv);
      expect(firstResponse.status).toBe(201);

      // Second registration with same email
      const secondRequest = createTestRequest(
          'POST',
          '/api/auth/register',
          userData
        );

      const secondResponse = await worker.fetch(secondRequest, mockEnv);
      
      expect(secondResponse.status).toBe(409);
      
      const result = await parseJsonResponse(secondResponse);
      expect(result.error).toContain('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        email: 'login@example.com',
        password: 'securepassword123',
        name: 'Login User'
      };

      const registerRequest = createTestRequest(
          'POST',
          '/api/auth/register',
          userData
        );

      const response = await worker.fetch(registerRequest, mockEnv);
      expect(response.status).toBe(201);

      // Now login
      const loginRequest = createTestRequest(
        'POST',
        '/api/auth/login',
        {
          email: userData.email,
          password: userData.password
        }
      );

      const loginResponse = await worker.fetch(loginRequest, mockEnv);
      
      expect(loginResponse.status).toBe(200);
      
      const result = await parseJsonResponse(loginResponse);
      expect(result.message).toContain('Login successful');
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const loginRequest = createTestRequest(
        'POST',
        '/api/auth/login',
        {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        }
      );

      const response = await worker.fetch(loginRequest, mockEnv);
      
      expect(response.status).toBe(401);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Invalid credentials');
    });

    it('should reject missing credentials', async () => {
      const loginRequest = createTestRequest(
        'POST',
        '/api/auth/login',
        {
          email: 'test@example.com'
          // Missing password
        }
      );

      const response = await worker.fetch(loginRequest, mockEnv);
      
      expect(response.status).toBe(400);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Missing credentials');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // Register and login first
      const userData = {
        email: 'logout@example.com',
        password: 'securepassword123',
        name: 'Logout User'
      };

      // DEBUG: Starting logout test
    // KV Cache before registration checked

      const registerRequest = createTestRequest(
          'POST',
          '/api/auth/register',
          userData
        );

      const registerResponse = await worker.fetch(registerRequest, mockEnv);
      const registerResult = await parseJsonResponse(registerResponse);
      const token = registerResult.token;
      // Registration response status logged
    // Registration result logged
    // Token received logged
    // KV Cache after registration checked

      // Now logout
      const logoutRequest = createTestRequest(
          'POST',
          '/api/auth/logout',
          {},
          { 'Authorization': `Bearer ${token}` }
        );

      const response = await worker.fetch(logoutRequest, mockEnv);
      // Logout response status logged
    const responseText = await response.text();
    // Logout response text logged
      
      expect(response.status).toBe(200);
      
      const result = JSON.parse(responseText);
      expect(result.message).toContain('Logout successful');
    });

    it('should reject logout without token', async () => {
      const logoutRequest = createTestRequest(
        'POST',
        '/api/auth/logout'
      );

      const response = await worker.fetch(logoutRequest, mockEnv);
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      // Register first
      const userData = {
        email: 'profile@example.com',
        password: 'securepassword123',
        name: 'Profile User'
      };

      const registerRequest = createTestRequest(
          'POST',
          '/api/auth/register',
          userData
        );

      const registerResponse = await worker.fetch(registerRequest, mockEnv);
      const registerResult = await parseJsonResponse(registerResponse);
      const token = registerResult.token;

      // Get profile
      const profileRequest = createTestRequest(
          'GET',
          '/api/auth/profile',
          undefined,
          { 'Authorization': `Bearer ${token}` }
        );

      const response = await worker.fetch(profileRequest, mockEnv);
      
      expect(response.status).toBe(200);
      
      const result = await parseJsonResponse(response);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
    });

    it('should reject profile request without token', async () => {
      const profileRequest = createTestRequest(
        'GET',
        '/api/auth/profile'
      );

      const response = await worker.fetch(profileRequest, mockEnv);
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/validate', () => {
    it('should validate valid token', async () => {
      // DEBUG: Starting token validation test
    // env object logged
    // env.JWT_SECRET logged
    // All env keys logged
      
      // Register first
      const userData = {
        email: 'validate@example.com',
        password: 'securepassword123',
        name: 'Validate User'
      };

      const registerRequest = createTestRequest(
          'POST',
          '/api/auth/register',
          userData
        );

      // DEBUG: Sending registration request
    const registerResponse = await worker.fetch(registerRequest, mockEnv);
    // Registration response status logged
    const registerResult = await parseJsonResponse(registerResponse);
    // Registration result logged
    const token = registerResult.token;
    // Token received logged

      // Wait a bit to ensure session is stored
      await new Promise(resolve => setTimeout(resolve, 100));

      // Validate token
      // DEBUG: Sending validation request
      const validateRequest = createTestRequest(
          'GET',
          '/api/auth/validate',
          undefined,
          { 'Authorization': `Bearer ${token}` }
        );

      const response = await worker.fetch(validateRequest, mockEnv);
      // Validation response status logged
    const responseText = await response.text();
    // Validation response text logged
      
      expect(response.status).toBe(200);
      
      const result = JSON.parse(responseText);
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
    });

    it('should reject invalid token', async () => {
      const validateRequest = createTestRequest(
          'GET',
          '/api/auth/validate',
          undefined,
          { 'Authorization': `Bearer invalid-token` }
        );

      const response = await worker.fetch(validateRequest, mockEnv);
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      console.log('JWT_SECRET in mockEnv:', mockEnv.JWT_SECRET);
      
      // Log response headers for debugging
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Try to parse the response as JSON to see the error details
      try {
        const responseJson = JSON.parse(responseText);
        console.log('Response JSON:', responseJson);
      } catch (e) {
        console.log('Failed to parse response as JSON:', e.message);
      }
      
      expect(response.status).toBe(401);
    });
  });
});