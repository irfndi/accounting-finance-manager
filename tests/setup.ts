// Vitest setup file
import { vi, beforeEach } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';

// Make React available globally for JSX
global.React = React;

// Mock environment variables for testing
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('JWT_SECRET', 'test-secret-key-for-testing');
vi.stubEnv('DATABASE_URL', 'file:./test.db');

// Mock Cloudflare Workers AI binding to prevent account access during testing
// Only mock when AI binding is actually accessed to avoid interfering with external API tests
const mockAI = {
  run: vi.fn().mockResolvedValue({
    response: 'Mocked AI response',
    success: true
  })
};

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Clean up any existing AI mock to prevent interference
  if ('AI' in global) {
    delete (global as any).AI;
  }
  
  // Reset AI mock to default behavior
  mockAI.run.mockResolvedValue({
    response: 'Mocked AI response',
    success: true
  });
});

// Export mockAI for tests that need to explicitly mock the Worker environment
export { mockAI };