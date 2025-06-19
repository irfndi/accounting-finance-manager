/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    // setupFiles: ['./tests/setup.ts'], // Disabled due to better-sqlite3 native dependency issues
    include: ['./tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.d.ts', '**/*.test.ts', '**/tests/**']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    },
    extensions: ['.ts', '.js']
  }
});