import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal Playwright configuration for basic testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/basic.spec.ts', '**/simple-login.spec.ts'],

  // Timeout configurations
  timeout: 60 * 1000, // 60 seconds per test
  globalTimeout: 15 * 60 * 1000, // 15 minutes total

  // Parallel execution
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,

  // Retry configuration
  retries: process.env.CI ? 2 : 0,

  // Fail fast on CI
  forbidOnly: !!process.env.CI,

  // Reporter
  reporter: process.env.CI ? [['junit', { outputFile: 'test-results/junit.xml' }], ['github']] : [['html', { outputFolder: 'playwright-report', open: 'never' }]],

  // Shared settings
  use: {
    baseURL: 'http://localhost:3000',

    // Timeout configurations
    actionTimeout: 15 * 1000, // 15 seconds for actions
    navigationTimeout: 30 * 1000, // 30 seconds for navigation

    // Performance optimizations
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: process.env.CI ? 'only-on-failure' : 'off',
    video: process.env.CI ? 'retain-on-failure' : 'off',

    // Faster page loads
    ignoreHTTPSErrors: true,
    bypassCSP: true,
  },

  // Expect timeout for assertions
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },

  // Simple projects - just the browsers we're testing
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.CI ? {
          args: ['--disable-images', '--disable-css', '--disable-extensions', '--no-sandbox', '--disable-setuid-sandbox']
        } : undefined,
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
  ],

  // Web server configuration
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for server startup
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Output directory for reports
  outputDir: 'test-results',
});