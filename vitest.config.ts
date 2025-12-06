import { resolve } from 'path';
import { defineWorkersConfig, defineWorkersProject } from '@cloudflare/vitest-pool-workers/config';
import { defineProject } from 'vitest/config';

export default defineWorkersConfig({
  plugins: [],
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
    globals: true,
    testTimeout: 10000,
    setupFiles: ['./tests/setup.ts'],
    include: ['./src/**/*.test.ts', './tests/unit/**/*.test.ts', './tests/integration/**/*.test.tsx'],
    // Workers pool handles all test environments automatically
    silent: false,
    reporters: ['verbose'],
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        'tests/**',
        'migrations/**',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 0,
          functions: 0,
          lines: 0,
          statements: 0
        }
      }
    },
    projects: [
      // Workers tests - for API endpoints and Workers functionality
      defineWorkersProject({
        test: {
          name: 'workers',
          include: ['./src/**/*.test.ts', './tests/unit/**/*.test.ts'],
          poolOptions: {
            workers: {
              wrangler: { configPath: './wrangler.jsonc' },
            },
          },
          globals: true,
          testTimeout: 10000,
          setupFiles: ['./tests/setup.ts'],
        },
        resolve: {
          alias: {
            '@': resolve(__dirname, './src'),
          },
          extensions: ['.ts', '.js', '.tsx', '.jsx'],
        },
      }),
      
      // Frontend tests - for React components
      defineProject({
        test: {
          name: 'frontend',
          include: ['./tests/integration/**/*.test.tsx'],
          environment: 'jsdom',
          globals: true,
          testTimeout: 10000,
          setupFiles: ['./tests/setup-frontend.ts'],
        },
        resolve: {
          alias: {
            '@': resolve(__dirname, './src'),
          },
        },
      }),
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    },
    extensions: ['.ts', '.js', '.tsx', '.jsx']
  }
});