import { vi, beforeEach } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';

// Make React available globally for JSX
global.React = React;

// Mock React DOM for better compatibility
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

// Mock window.matchMedia (only in browser environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock environment variables for testing
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('JWT_SECRET', 'test-secret-key-for-testing');
vi.stubEnv('DATABASE_URL', 'file:./test.db');

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage (only in browser environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(() => 'mock-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
}

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});