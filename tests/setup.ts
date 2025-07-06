// Vitest setup file for Cloudflare Workers
import { vi, beforeEach } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';
import { createTestDatabase } from './helpers/database';


// Make React available globally for JSX
global.React = React;

// Mock environment variables for testing
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('JWT_SECRET', 'test-secret-key-for-testing');
vi.stubEnv('DATABASE_URL', 'file:./test.db');

// Mock Cloudflare Workers AI binding for testing
const mockAI = {
  run: vi.fn().mockResolvedValue({
    response: 'Mocked AI response',
    success: true
  })
};

// Mock KV binding for testing
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

// Mock R2 binding for testing
const mockR2 = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  head: vi.fn(),
};

// Mock D1 binding for testing
const mockD1 = {
  prepare: vi.fn(),
  dump: vi.fn(),
  batch: vi.fn(),
  exec: vi.fn(),
};

let testDbInstance: any = null;

// Mock the entire database module
vi.mock('../src/db/index.js', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    // Provide a mock implementation for createDatabase that returns our test instance
    createDatabase: vi.fn(() => testDbInstance),
  };
});

beforeEach(async () => {
  // Create a fresh, async in-memory database for each test
  const { mockDb } = await createTestDatabase();
  testDbInstance = mockDb;
});

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Clean up any existing bindings to prevent interference
  const globalBindings = ['AI', 'FINANCE_MANAGER_CACHE', 'FINANCE_MANAGER_DOCUMENTS', 'FINANCE_MANAGER_DB'];
  globalBindings.forEach(binding => {
    if (binding in global) {
      delete (global as any)[binding];
    }
  });
  
  // Reset mock implementations
  mockAI.run.mockResolvedValue({
    response: 'Mocked AI response',
    success: true
  });
  
  mockKV.get.mockResolvedValue(null);
  mockKV.put.mockResolvedValue(undefined);
  mockKV.delete.mockResolvedValue(undefined);
  mockKV.list.mockResolvedValue({ keys: [] });
  
  mockR2.get.mockResolvedValue(null);
  mockR2.put.mockResolvedValue(undefined);
  mockR2.delete.mockResolvedValue(undefined);
  mockR2.list.mockResolvedValue({ objects: [] });
  mockR2.head.mockResolvedValue(null);
  
  mockD1.prepare.mockReturnValue({
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    run: vi.fn(),
    all: vi.fn(),
  });
  mockD1.batch.mockResolvedValue([]);
  mockD1.exec.mockResolvedValue({ success: true });
});

// Export mocks for tests that need to explicitly mock the Worker environment
export { mockAI, mockKV, mockR2, mockD1 };