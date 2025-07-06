import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false,
    reporters: ['dot'],
    include: [
      'tests/unit/database-*.test.ts'
    ],
    exclude: [
      'tests/unit/*.test.tsx', 
      'tests/integration/*.test.tsx',
      'tests/unit/api-*.test.ts',
      'tests/unit/budgets-api.test.ts',
      'tests/unit/ai-service.test.ts',
      'tests/unit/worker.test.ts',
      'tests/unit/ai.test.ts',
      'tests/unit/financial-reports.test.ts'
    ],
    setupFiles: ['tests/setup.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/db/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/worker/**/*',
        'src/web/**/*',
        'src/ai/**/*',
        'tests/**/*',
        'node_modules/**/*'
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    }
  }
}) 