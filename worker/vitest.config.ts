import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          compatibilityDate: '2024-01-01',
          compatibilityFlags: ['nodejs_compat'],
          bindings: {
            ENVIRONMENT: 'test',
            JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
            AUTH_SESSION_DURATION: '86400'
          },
          kvNamespaces: ['FINANCE_MANAGER_CACHE'],
          r2Buckets: ['FINANCE_MANAGER_DOCUMENTS'],
          d1Databases: ['FINANCE_MANAGER_DB']
        }
      }
    },
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 20000,
    hookTimeout: 20000
  }
})