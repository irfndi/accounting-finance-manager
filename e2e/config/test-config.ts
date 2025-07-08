/**
 * E2E Test Configuration
 * 
 * This module provides test configuration for E2E tests without Vitest dependencies
 * to avoid conflicts with Playwright's expect matchers.
 */

/**
 * Test environment configuration
 */
export const testConfig = {
  database: {
    url: 'file:./test.db',
    maxConnections: 1,
    timeout: 30000,
  },
  auth: {
    jwtSecret: 'test-secret-key-for-testing',
    tokenExpiry: '1h',
    sessionExpiry: '24h',
  },
  workers: {
    singleWorker: true,
    compatibilityDate: '2024-01-01',
    compatibilityFlags: ['nodejs_compat'],
  },
} as const;

/**
 * Environment variables for testing
 */
export const testEnvVars = {
  NODE_ENV: 'test',
  JWT_SECRET: testConfig.auth.jwtSecret,
  DATABASE_URL: testConfig.database.url,
} as const;