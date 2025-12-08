import { resolve } from 'path';
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

const useCloudflarePool = process.env.VITEST_USE_CF_POOL === 'true';

export default defineWorkersConfig({
  plugins: [],
  test: {
    pool: useCloudflarePool ? '@cloudflare/vitest-pool-workers' : 'threads',
    poolOptions: useCloudflarePool
      ? {
          workers: {
            wrangler: { configPath: './wrangler.jsonc' },
          },
        }
      : undefined,
    globals: true,
    testTimeout: 10000,
    setupFiles: ['./tests/setup.ts'],
    include: ['./src/**/*.test.ts', './tests/**/*.test.ts'],
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
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  }
});
