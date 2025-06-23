import { vi } from 'vitest'
import type { Env } from '../src/types'
import { sign } from 'hono/jwt'

// Global test utilities for API testing
declare global {
  var workerTestUtils: {
    createTestRequest: (method: string, url: string, options?: RequestInit) => Request;
    createAuthenticatedRequest: (method: string, url: string, token: string, options?: RequestInit) => Request;
    parseJsonResponse: (response: Response) => Promise<any>;
    createMockFormData: (files?: File[]) => FormData;
    createTestJWTToken: (payload: any, secret?: string) => Promise<string>;
  };
}

vi.mock('@finance-manager/core', () => ({
  // Add mocks for any functions/objects you use from @finance-manager/core
}));

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

const createMockFormData = (files: File[] = []) => {
  const formData = new FormData();
  
  files.forEach((file, index) => {
    formData.append(`file${index}`, file);
  });
  
  formData.append('description', 'Test file upload');
  formData.append('category', 'receipt');
  
  return formData;
};

const createTestJWTToken = async (payload: any, secret?: string) => {
  const jwtSecret = secret || 'test-jwt-secret-key-for-testing-only';
  return await sign(payload, jwtSecret);
};

globalThis.workerTestUtils = {
  createTestRequest,
  createAuthenticatedRequest,
  parseJsonResponse,
  createMockFormData,
  createTestJWTToken
};

// Mock fetch for external API calls
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers()
  } as Response)
);

// Mock console for cleaner test output - temporarily disabled for debugging
// (globalThis as any).console = {
//   ...console,
//   log: vi.fn(),
//   warn: vi.fn(),
//   error: vi.fn(),
//   info: vi.fn(),
//   debug: vi.fn()
// } as Console;

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ENVIRONMENT = 'test';