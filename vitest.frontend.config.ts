import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'frontend-coverage',
    include: ['./tests/integration/**/*.test.tsx', './src/web/**/*.test.tsx'],
    environment: 'jsdom',
    globals: true,
    testTimeout: 10000,
    setupFiles: ['./tests/setup-frontend.ts'],
    coverage: {
      enabled: false, // Disabled due to Cloudflare Workers environment compatibility issues with v8 provider
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/web/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/types/**/*.{ts,tsx}'
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.test.tsx',
        'tests/**',
        'migrations/**',
        '**/*.config.*',
        '**/*.d.ts',
        'src/global.d.ts',
        'worker-configuration.d.ts',
        'src/worker/**',
        'src/db/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});