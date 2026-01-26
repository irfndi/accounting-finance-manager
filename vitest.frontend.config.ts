import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup-frontend.ts'],
    include: ['./tests/integration/**/*.test.tsx'],
    testTimeout: 10000,
    silent: false,
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});