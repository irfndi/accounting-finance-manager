import { test as setup, expect } from '@playwright/test';
import { getTestDatabaseUrl } from './config/environments';

// Setup test database and initial data
setup('prepare test environment', async ({ page }) => {
  console.log('Setting up test environment...');
  
  // Set test database URL in environment
  process.env.DATABASE_URL = getTestDatabaseUrl();
  
  // Wait for the development server to be ready
  await page.goto('/');
  
  // Check if the app is running
  await expect(page.locator('body')).toBeVisible();
  
  // Wait for any initial API calls to complete
  await page.waitForTimeout(2000);
  
  console.log('Test environment setup complete');
});

// Optional: Create test data
setup('seed test data', async ({ request }) => {
  console.log('Seeding test data...');
  
  // Create a few test accounts for E2E tests
  const testAccounts = [
    {
      code: '1000',
      name: 'Test Cash Account',
      type: 'ASSET',
      normalBalance: 'debit',
      description: 'Test cash account for E2E tests'
    },
    {
      code: '2000',
      name: 'Test Liability Account',
      type: 'LIABILITY',
      normalBalance: 'credit',
      description: 'Test liability account for E2E tests'
    },
    {
      code: '3000',
      name: 'Test Equity Account',
      type: 'EQUITY',
      normalBalance: 'credit',
      description: 'Test equity account for E2E tests'
    }
  ];
  
  for (const account of testAccounts) {
    try {
      const response = await request.post('/api/accounts', {
        data: account,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok()) {
        console.log(`Created test account: ${account.name}`);
      } else {
        const error = await response.text();
        console.log(`Account ${account.name} might already exist or failed to create: ${error}`);
      }
    } catch (error) {
      console.log(`Error creating account ${account.name}:`, error);
    }
  }
  
  console.log('Test data seeding complete');
});