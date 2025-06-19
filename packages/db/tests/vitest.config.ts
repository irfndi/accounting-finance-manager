import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'db',
    root: path.resolve(__dirname, '..'),
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        'dist/',
        'build/',
        'migrations/'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['node_modules/', 'dist/', 'build/', 'migrations/'],
    testTimeout: 15000,
    hookTimeout: 15000,
    setupFiles: [path.resolve(__dirname, './setup.ts')],
    isolate: true,
    pool: 'threads',
    // Ensure tests run sequentially to avoid database conflicts
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@tests': path.resolve(__dirname, '../tests')
    }
  }
});