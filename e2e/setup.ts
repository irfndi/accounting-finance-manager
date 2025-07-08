import { chromium, type FullConfig } from '@playwright/test';
import { getTestDatabaseUrl } from './config/environments';
import { setupGlobalAuth } from './helpers/auth';
import { testConfig } from './config/test-config';
import fs from 'fs';
import path from 'path';

async function globalSetup(_config: FullConfig) {
  // Set test environment variables
  process.env.DATABASE_URL = getTestDatabaseUrl();
  process.env.JWT_SECRET = testConfig.auth.jwtSecret;
  process.env.NODE_ENV = 'test';
  
  // Wait for the development server to be ready
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for server to be available
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Development server is ready');
    
    // Setup authentication and create test users
    await setupGlobalAuth(page);
    console.log('✅ Test users created and authenticated');
    
    // Ensure auth directory exists
    fs.mkdirSync(path.dirname('playwright/.auth/user.json'), { recursive: true });
    
    // Save storage state for authenticated user for use in subsequent tests
    await context.storageState({ path: 'playwright/.auth/user.json' });
    console.log('✅ Saved authenticated storage state');
    
    // Seed test data if needed
    await seedTestData(page);
    
  } catch (error) {
    console.error('❌ Failed to setup E2E environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function seedTestData(page: any) {
  try {
    // Get auth token for API requests
    const authToken = await page.evaluate(() => localStorage.getItem('finance_manager_token'));
    
    const headers = authToken ? {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    } : {
      'Content-Type': 'application/json',
    };

    // Create test accounts
    const testAccounts = [
      {
        name: 'Test Cash Account',
        type: 'asset',
        subtype: 'current_asset',
        code: 'TEST001',
        description: 'Test cash account for E2E tests',
      },
      {
        name: 'Test Revenue Account',
        type: 'revenue',
        subtype: 'operating_revenue',
        code: 'TEST002',
        description: 'Test revenue account for E2E tests',
      },
    ];

    for (const account of testAccounts) {
      try {
        await page.request.post('http://localhost:3000/api/accounts', {
          data: account,
          headers,
        });
      } catch (error) {
        // Ignore if account already exists
        if (error instanceof Error && !error.message.includes('already exists')) {
          console.warn('Failed to create test account:', account.name, error.message);
        }
      }
    }
    
    console.log('✅ Test data seeded successfully');
  } catch (error) {
    console.log('ℹ️ Test data seeding skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export default globalSetup;