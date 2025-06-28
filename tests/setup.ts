// Vitest setup file
import { vi, beforeEach } from 'vitest';

// Mock environment variables for testing
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('JWT_SECRET', 'test-secret-key-for-testing');
vi.stubEnv('DATABASE_URL', 'file:./test.db');

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});