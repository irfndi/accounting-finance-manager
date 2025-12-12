import { type FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * This runs once before all tests
 */
async function globalSetup(_config: FullConfig) {
  console.log('Running global setup...');
  
  // Add any global setup logic here
  // Examples:
  // - Setting up authentication state
  // - Database seeding
  // - Starting external services
  // - Setting up test data
  
  console.log('✓ Global setup complete');
}

export default globalSetup;
