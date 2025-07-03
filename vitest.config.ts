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
      enabled: false, // Temporarily disabled due to Cloudflare Workers compatibility
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
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
        'worker-configuration.d.ts'
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