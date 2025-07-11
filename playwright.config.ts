import { defineConfig, devices } from '@playwright/test';

// Minimal environment cleanup for Playwright isolation
if (typeof process !== 'undefined' && process.env) {
  delete process.env.JEST_WORKER_ID;
  delete process.env.VITEST;
  delete process.env.VITEST_WORKER_ID;
  delete process.env.VITEST_POOL_ID;
}

// Define environment config inline to avoid module contamination
const _environment = process.env.CI ? 'ci' : 'development';

/**
 * Optimized Playwright configuration for fast CI execution
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/debug-*.spec.ts'],
  
  // Global setup and teardown
  globalSetup: './e2e/setup.ts',
  globalTeardown: './e2e/teardown.ts',
  
  // Timeout configurations - critical for preventing 15min timeouts
  timeout: 30 * 1000, // 30 seconds per test
  globalTimeout: 10 * 60 * 1000, // 10 minutes total
  
  // Parallel execution for speed
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined, // Increased from 1 to 2 for CI
  
  // Retry configuration
  retries: process.env.CI ? 1 : 0, // Reduced from 2 to 1 retry
  
  // Fail fast on CI
  forbidOnly: !!process.env.CI,
  
  // Optimized reporter for CI
  reporter: process.env.CI ? [['junit', { outputFile: 'test-results/junit.xml' }], ['github']] : [['html', { outputFolder: 'playwright-report', open: 'never' }]],
  
  // Shared settings optimized for performance
  use: {
    baseURL: 'http://localhost:3000',
    
    // Timeout configurations
    actionTimeout: 10 * 1000, // 10 seconds for actions
    navigationTimeout: 15 * 1000, // 15 seconds for navigation
    
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
    timeout: 5 * 1000, // 5 seconds for assertions
  },

  // Optimized projects - focus on Chromium for CI speed
  projects: process.env.CI ? [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'auth-tests',
      testMatch: '**/auth.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        // Auth tests need clean state - no storageState
      },
      dependencies: ['setup'],
    },
    {
      name: 'chromium',
      testIgnore: ['**/auth.spec.ts', '**/*.setup.ts'],
      use: { 
        ...devices['Desktop Chrome'],
        // Use saved authentication state
        storageState: 'playwright/.auth/user.json',
        // Disable images and CSS for faster loading in CI
        launchOptions: {
          args: ['--disable-images', '--disable-css'],
        },
      },
      dependencies: ['setup'],
    },
  ] : [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'auth-tests',
      testMatch: '**/auth.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        // Auth tests need clean state - no storageState
      },
      dependencies: ['setup'],
    },
    {
      name: 'chromium',
      testIgnore: ['**/auth.spec.ts', '**/*.setup.ts'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testIgnore: ['**/auth.spec.ts', '**/*.setup.ts'],
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // WebKit disabled due to connection issues on some systems
    // {
    //   name: 'webkit',
    //   testIgnore: ['**/auth.spec.ts', '**/*.setup.ts'],
    //   use: { 
    //     ...devices['Desktop Safari'],
    //     storageState: 'playwright/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  // Optimized web server configuration
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // Increased timeout for server startup
    stdout: 'pipe', // Enable stdout to see server logs
    stderr: 'pipe', // Enable stderr to see server errors
  },

  // Output directory for reports
  outputDir: 'test-results',
});