import { chromium, type FullConfig } from '@playwright/test';
import { getTestDatabaseUrl } from './config/environments';
import { setupGlobalAuth } from './helpers/auth';
import { testConfig } from './config/test-config';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  // Set test environment variables
  process.env.DATABASE_URL = getTestDatabaseUrl();
  process.env.JWT_SECRET = testConfig.auth.jwtSecret;
  process.env.NODE_ENV = 'test';
  
  console.log('🚀 Starting global setup...');
  
  // Get baseURL from config
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log(`🔗 Connecting to server at ${baseURL}`);
    
    // Navigate to login page which doesn't require authentication
    await page.goto(`${baseURL}/login`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('✅ Server is ready and accessible');
    
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
    // Get auth token from storage state instead of localStorage
    let authToken = null;
    try {
      const storageState = await page.context().storageState();
      const localStorage = storageState.origins?.[0]?.localStorage;
      authToken = localStorage?.find(item => item.name === 'finance_manager_token')?.value;
    } catch {
      console.log('ℹ️ Could not access storage state for auth token');
    }
    
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