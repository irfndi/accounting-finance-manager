"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const path_1 = __importDefault(require("path"));
exports.default = (0, config_1.defineConfig)({
    test: {
        name: 'db',
        root: path_1.default.resolve(__dirname, '..'),
        environment: 'node',
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
                'migrations/'
            ],
            thresholds: {
                global: {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85
                }
            }
        },
        include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
        exclude: ['node_modules/', 'dist/', 'build/', 'migrations/'],
        testTimeout: 15000,
        hookTimeout: 15000,
        setupFiles: [path_1.default.resolve(__dirname, './setup.ts')],
        isolate: true,
        pool: 'threads',
        // Ensure tests run sequentially to avoid database conflicts
        poolOptions: {
            threads: {
                singleThread: true
            }
        }
    },
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, '../src'),
            '@tests': path_1.default.resolve(__dirname, '../tests')
        }
    }
});
