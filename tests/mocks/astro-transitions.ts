// Mock implementation of astro:transitions/client for testing
import { vi } from 'vitest';

export const navigate = vi.fn();

// Export default for compatibility
export default {
  navigate,
};