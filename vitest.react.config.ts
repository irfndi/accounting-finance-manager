import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false,
    reporters: ['dot'],
    include: ['tests/unit/*.test.tsx', 'tests/integration/*.test.tsx'],
    environment: 'happy-dom',
    setupFiles: ['tests/setup-frontend.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      'astro:transitions/client': new URL('./tests/mocks/astro-transitions.ts', import.meta.url).pathname,
    },
  },
})