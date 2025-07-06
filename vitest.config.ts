import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'
import { defineConfig } from 'vitest/config'

// Use Workers config for Workers-specific tests
const workersConfig = defineWorkersConfig({
  test: {
    watch: false,
    reporters: ['dot'],
    include: ['tests/unit/*.test.ts', 'tests/integration/*.test.ts'],
    exclude: ['tests/unit/*.test.tsx', 'tests/integration/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
    globals: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.test.jsonc' },
        main: './src/worker/index.ts',
        isolatedStorage: false,
        singleWorker: true,
        miniflare: {
          // Simple KV namespace configuration for testing
          kvNamespaces: {
            FINANCE_MANAGER_CACHE: 'TEST_FINANCE_MANAGER_CACHE',
            TEST_NAMESPACE: 'TEST_NAMESPACE'
          },
          d1Databases: {
            FINANCE_MANAGER_DB: 'test-db'
          }
        }
      }
    },
    coverage: {
      enabled: false // Disable coverage for Workers environment due to node:inspector incompatibility
    }
  }
})

// Use regular Node config for coverage reporting
const nodeCoverageConfig = defineConfig({
  test: {
    watch: false,
    reporters: ['dot'],
    include: [
      'tests/unit/database-*.test.ts',
      'tests/unit/financial-reports.test.ts',
      'tests/unit/ai.test.ts'
    ],
    exclude: ['tests/unit/*.test.tsx', 'tests/integration/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'tests/**/*',
        'node_modules/**/*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})

// Export Workers config by default
export default workersConfig

// Export coverage config for coverage testing
export const coverageConfig = nodeCoverageConfig