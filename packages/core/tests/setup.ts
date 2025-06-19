import { vi } from 'vitest';

// Global test configuration
globalThis.console = {
  ...console,
  // Suppress console output during tests unless explicitly needed
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as Console;

// Mock global crypto for Node.js environment
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  }
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Global test utilities
declare global {
  var testUtils: {
    createMockDatabase: () => any;
    createMockUser: () => any;
    createMockTransaction: () => any;
  };
}

globalThis.testUtils = {
  createMockDatabase: () => ({
    getUserById: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  }),
  
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  
  createMockTransaction: () => ({
    id: 1,
    transactionNumber: 'TXN-001',
    description: 'Test transaction',
    type: 'JOURNAL' as const,
    source: 'MANUAL' as const,
    status: 'POSTED' as const,
    totalAmount: 100.00,
    entityId: 'test-entity',
    transactionDate: new Date(),
    postedDate: new Date(),
    entries: []
  })
}; 