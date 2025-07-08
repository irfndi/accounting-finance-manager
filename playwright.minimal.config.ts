import { defineConfig, devices } from '@playwright/test';

// Completely isolated Playwright configuration
// This config ensures zero interference from other test frameworks

/**
 * Minimal Playwright configuration for isolated E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e-isolated',
  testMatch: '**/*.spec.ts',
  
  // Basic timeout configurations
  timeout: 30 * 1000, // 30 seconds per test
  globalTimeout: 10 * 60 * 1000, // 10 minutes total
  
  // Sequential execution to avoid conflicts
  fullyParallel: false,
  workers: 1,
  
  // No retries for debugging
  retries: 0,
  
  // Simple reporter
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-minimal', open: 'never' }]],
  
  // Minimal settings
  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  // Expect timeout for assertions
  expect: {
    timeout: 5 * 1000,
  },

  // Single project - Chromium only
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server configuration
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Output directory
  outputDir: 'test-results-minimal',
});