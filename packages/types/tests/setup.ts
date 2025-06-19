import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Global test setup for types package
// This package primarily contains TypeScript type definitions
// so tests will focus on type validation and utility functions

// Mock console to avoid noise in tests
const originalConsole = console;
beforeEach(() => {
  // Suppress console output during tests unless explicitly needed
  global.console = {
    ...originalConsole,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  } as any;
});

afterEach(() => {
  // Restore original console
  global.console = originalConsole;
  vi.clearAllMocks();
});

// Global test utilities for type validation
declare global {
  var typeTestUtils: {
    isValidType: <T>(value: any, validator: (val: any) => val is T) => boolean;
    expectTypeError: (fn: () => void) => void;
    validateSchema: (data: any, schema: any) => boolean;
  };
}

globalThis.typeTestUtils = {
  isValidType: <T>(value: any, validator: (val: any) => val is T): boolean => {
    try {
      return validator(value);
    } catch {
      return false;
    }
  },

  expectTypeError: (fn: () => void): void => {
    expect(() => fn()).toThrow();
  },

  validateSchema: (data: any, schema: any): boolean => {
    // Simple schema validation for testing
    if (typeof schema === 'object' && schema !== null) {
      for (const key in schema) {
        if (!(key in data)) return false;
        if (typeof data[key] !== typeof schema[key]) return false;
      }
    }
    return true;
  }
};