import { describe, it, expect, beforeEach, vi } from 'vitest';
import app from '../../src/index';

// Test utilities
const createTestRequest = (method: string, url: string, options: RequestInit = {}) => {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
};

const createAuthenticatedRequest = (method: string, url: string, token: string, options: RequestInit = {}) => {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  });
};

const parseJsonResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse JSON response: ${text}`);
  }
};

const createTestJWTToken = (payload: any) => {
  // Simple JWT token for testing (not secure, only for tests)
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = 'test-signature';
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const mockCloudflareBindings = () => ({
  ENVIRONMENT: 'test',
  JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
  AUTH_SESSION_DURATION: '7d',
  FINANCE_MANAGER_DB: {
    prepare: vi.fn(() => ({
      bind: vi.fn().mockReturnThis(),
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(() => []),
      first: vi.fn()
    })),
    batch: vi.fn(),
    dump: vi.fn(),
    exec: vi.fn()
  },
  FINANCE_MANAGER_CACHE: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  },
  FINANCE_MANAGER_DOCUMENTS: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    head: vi.fn()
  }
});

describe('Authentication API', () => {
  let env: any;

  beforeEach(() => {
    env = mockCloudflareBindings();
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
        'https://example.com/api/auth/register',
        { body: JSON.stringify(userData) }
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(201);
      
      const result = await parseJsonResponse(response);
      expect(result.message).toContain('User registered successfully');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.passwordHash).toBeUndefined(); // Should not expose password hash
    });

    it('should reject invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'testpassword123',
        name: 'Test User'
      };

      const request = createTestRequest(
        'POST',
        'https://example.com/api/auth/register',
        { body: JSON.stringify(userData) }
      );

      const response = await app.fetch(request, env);
      
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
        'https://example.com/api/auth/register',
        { body: JSON.stringify(userData) }
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(400);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Password must be at least');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User'
      };

      // Mock database to simulate existing user
      env.FINANCE_MANAGER_DB.prepare().get.mockReturnValue({
        id: 'existing-user-id',
        email: userData.email
      });

      const request = createTestRequest(
        'POST',
        'https://example.com/api/auth/register',
        { body: JSON.stringify(userData) }
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(409);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      // Mock database to return user with hashed password
      env.FINANCE_MANAGER_DB.prepare().get.mockReturnValue({
        id: 'test-user-id',
        email: loginData.email,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$valid-hash',
        role: 'USER'
      });

      const request = createTestRequest(
        'POST',
        'https://example.com/api/auth/login',
        { body: JSON.stringify(loginData) }
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(200);
      
      const result = await parseJsonResponse(response);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.user.passwordHash).toBeUndefined();
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Mock database to return null (user not found)
      env.FINANCE_MANAGER_DB.prepare().get.mockReturnValue(null);

      const request = createTestRequest(
        'POST',
        'https://example.com/api/auth/login',
        { body: JSON.stringify(loginData) }
      );

      const response = await app.fetch(request, env);
      
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
        'https://example.com/api/auth/login',
        { body: JSON.stringify(loginData) }
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(400);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Email and password are required');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const token = createTestJWTToken({
        userId: 'test-user-id',
        role: 'USER'
      });

      // Mock database to return user
      env.FINANCE_MANAGER_DB.prepare().get.mockReturnValue({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      });

      const request = createAuthenticatedRequest(
        'GET',
        'https://example.com/api/auth/profile',
        token
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(200);
      
      const result = await parseJsonResponse(response);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.passwordHash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const request = createTestRequest(
        'GET',
        'https://example.com/api/auth/profile'
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(401);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Unauthorized');
    });

    it('should reject request with invalid token', async () => {
      const request = createAuthenticatedRequest(
        'GET',
        'https://example.com/api/auth/profile',
        'invalid.token.here'
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(401);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Invalid token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const token = createTestJWTToken({
        userId: 'test-user-id',
        role: 'USER'
      });

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      // Mock database operations
      env.FINANCE_MANAGER_DB.prepare().get.mockReturnValue({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Old',
        lastName: 'Name',
        role: 'USER'
      });

      env.FINANCE_MANAGER_DB.prepare().run.mockReturnValue({ success: true });

      const request = createAuthenticatedRequest(
        'PUT',
        'https://example.com/api/auth/profile',
        token,
        { body: JSON.stringify(updateData) }
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(200);
      
      const result = await parseJsonResponse(response);
      expect(result.message).toContain('Profile updated successfully');
      expect(result.user.firstName).toBe(updateData.firstName);
      expect(result.user.lastName).toBe(updateData.lastName);
    });

    it('should validate update data', async () => {
      const token = createTestJWTToken({
        userId: 'test-user-id',
        role: 'USER'
      });

      const updateData = {
        firstName: '', // Invalid empty string
        email: 'invalid-email-format' // Invalid email
      };

      const request = createAuthenticatedRequest(
        'PUT',
        'https://example.com/api/auth/profile',
        token,
        { body: JSON.stringify(updateData) }
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(400);
      
      const result = await parseJsonResponse(response);
      expect(result.error).toContain('Validation failed');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const token = createTestJWTToken({
        userId: 'test-user-id',
        role: 'USER'
      });

      const request = createAuthenticatedRequest(
        'POST',
        'https://example.com/api/auth/logout',
        token
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(200);
      
      const result = await parseJsonResponse(response);
      expect(result.message).toContain('Logged out successfully');
    });

    it('should handle logout without token gracefully', async () => {
      const request = createTestRequest(
        'POST',
        'https://example.com/api/auth/logout'
      );

      const response = await app.fetch(request, env);
      
      expect(response.status).toBe(200);
      
      const result = await parseJsonResponse(response);
      expect(result.message).toContain('Logged out');
    });
  });
});