import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'ai',
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
        '**/fixtures/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['node_modules/', 'dist/', 'build/'],
    testTimeout: 30000, // AI operations may take longer
    hookTimeout: 30000,
    setupFiles: ['./tests/setup.ts'],
    isolate: true,
    pool: 'threads',
    // AI tests may need more time and resources
    poolOptions: {
      threads: {
        maxThreads: 2,
        minThreads: 1
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