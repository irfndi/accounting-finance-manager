import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
    test: {
        name: 'worker',
        root: path.resolve(__dirname, '..'),
        environment: 'miniflare',
        environmentOptions: {
            bindings: {
                ENVIRONMENT: 'test',
                JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
                FINANCE_MANAGER_DB: ':memory:',
                R2_BUCKET: 'test-bucket'
            },
            kvNamespaces: ['TEST_KV'],
            r2Buckets: ['R2_BUCKET'],
            durableObjects: {},
        },
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './tests/coverage',
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.d.ts',
                'dist/',
                'build/',
                'wrangler.toml'
            ],
            thresholds: {
                global: {
                    branches: 75,
                    functions: 75,
                    lines: 75,
                    statements: 75
                }
            }
        },
        include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
        exclude: ['node_modules/', 'dist/', 'build/'],
        testTimeout: 20000,
        hookTimeout: 20000,
        setupFiles: ['./tests/setup.ts'],
        isolate: true,
        pool: 'threads',
        // API tests may need sequential execution
        poolOptions: {
            threads: {
                singleThread: true
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../src'),
            '@tests': path.resolve(__dirname, '../tests')
        }
    }
});
