import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config';
import { defineProject } from 'vitest/config';
import { resolve } from 'path';

export default [
  // Workers tests - for API endpoints and Workers functionality
  defineWorkersProject({
    test: {
      name: 'workers',
      include: ['./src/**/*.test.ts', './tests/unit/**/*.test.ts'],
      pool: '@cloudflare/vitest-pool-workers',
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
];