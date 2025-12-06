import { test as teardown } from '@playwright/test';
import { getTestDatabaseUrl } from './config/environments';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

// Clean up test environment
teardown('cleanup test environment', async () => {
  console.log('Cleaning up test environment...');
  
  const testDbUrl = getTestDatabaseUrl();
  
  // If using SQLite, delete the test database file
  if (testDbUrl.includes('.sqlite')) {
    try {
      if (existsSync(testDbUrl)) {
        await unlink(testDbUrl);
        console.log(`Deleted test database: ${testDbUrl}`);
      }
    } catch (error) {
      console.warn(`Failed to delete test database ${testDbUrl}:`, error);
    }
  }
  
  // Clean up any test artifacts
  const testArtifacts = [
    './test-results',
    './playwright-report'
  ];
  
  for (const artifact of testArtifacts) {
    try {
      if (existsSync(artifact)) {
        console.log(`Test artifacts will be preserved in: ${artifact}`);
      }
    } catch (error) {
      console.warn(`Error checking artifact ${artifact}:`, error);
    }
  }
  
  console.log('Test environment cleanup complete');
});