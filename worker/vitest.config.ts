import { resolve } from 'path';
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  plugins: [],
  test: {
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
      },
    },
    globals: true,
    testTimeout: 10000,
    setupFiles: ['./tests/setup.ts'],
    include: ['./tests/**/*.test.ts'],
    silent: false,
    reporters: ['verbose'],
    coverage: {
      enabled: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    },
    extensions: ['.ts', '.js']
  }
});