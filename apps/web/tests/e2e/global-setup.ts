import { chromium, FullConfig } from '@playwright/test';
import { testData } from './fixtures/test-data';

/**
 * Global setup for Playwright tests
 * Runs once before all tests to prepare the environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  const { baseURL } = config.projects[0].use;
  
  if (!baseURL) {
    throw new Error('Base URL is not configured');
  }
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await waitForApplication(page, baseURL);
    
    // Setup test data if needed
    console.log('📊 Setting up test data...');
    await setupTestData(page, baseURL);
    
    // Verify critical pages are accessible
    console.log('🔍 Verifying critical pages...');
    await verifyCriticalPages(page, baseURL);
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Wait for the application to be ready and responsive
 */
async function waitForApplication(page: any, baseURL: string) {
  const maxRetries = 30;
  const retryDelay = 2000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries}: Checking ${baseURL}`);
      
      const response = await page.goto(baseURL, {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      if (response && response.ok()) {
        // Verify the page has loaded properly
        const title = await page.title();
        const hasContent = await page.locator('body').isVisible();
        
        if (title && hasContent) {
          console.log(`✅ Application is ready (title: "${title}")`);
          return;
        }
      }
      
      throw new Error(`Application not ready (status: ${response?.status()})`);
      
    } catch (error) {
      console.log(`⚠️  Attempt ${i + 1} failed:`, error.message);
      
      if (i === maxRetries - 1) {
        throw new Error(`Application failed to start after ${maxRetries} attempts`);
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Setup initial test data if the application supports it
 */
async function setupTestData(page: any, baseURL: string) {
  try {
    // Check if there's an API endpoint for seeding data
    const seedResponse = await page.request.post(`${baseURL}/api/test/seed`, {
      data: {
        accounts: testData.accounts,
        transactions: testData.transactions
      },
      failOnStatusCode: false
    });
    
    if (seedResponse.ok()) {
      console.log('✅ Test data seeded via API');
      return;
    }
    
  } catch (error) {
    console.log('ℹ️  API seeding not available, will use UI-based setup');
  }
  
  // Fallback: Setup data through UI if API is not available
  await setupDataThroughUI(page, baseURL);
}

/**
 * Setup test data through the user interface
 */
async function setupDataThroughUI(page: any, baseURL: string) {
  try {
    // Navigate to chart of accounts
    await page.goto(`${baseURL}/chart-of-accounts`);
    await page.waitForLoadState('networkidle');
    
    // Check if we need to add default accounts
    const accountsTable = page.locator('table, [data-testid="accounts-table"]');
    const hasAccounts = await accountsTable.isVisible({ timeout: 5000 });
    
    if (!hasAccounts) {
      console.log('📝 Setting up default accounts through UI...');
      
      // Add essential accounts for testing
      const essentialAccounts = [
        { name: 'Test Cash', code: '1001', type: 'Asset', description: 'Test cash account' },
        { name: 'Test Revenue', code: '4001', type: 'Revenue', description: 'Test revenue account' }
      ];
      
      for (const account of essentialAccounts) {
        const addButton = page.locator('button:has-text("Add Account"), [data-testid="add-account"]');
        
        if (await addButton.isVisible({ timeout: 2000 })) {
          await addButton.click();
          
          const form = page.locator('form, [data-testid="account-form"]');
          await form.waitFor({ state: 'visible', timeout: 5000 });
          
          await page.fill('input[name="name"], [data-testid="account-name"]', account.name);
          await page.fill('input[name="code"], [data-testid="account-code"]', account.code);
          
          const typeSelect = page.locator('select[name="type"], [data-testid="account-type"]');
          if (await typeSelect.isVisible({ timeout: 2000 })) {
            await typeSelect.selectOption(account.type);
          }
          
          const descriptionField = page.locator('textarea[name="description"], [data-testid="account-description"]');
          if (await descriptionField.isVisible({ timeout: 2000 })) {
            await descriptionField.fill(account.description);
          }
          
          const submitButton = page.locator('button[type="submit"], [data-testid="submit-account"]');
          await submitButton.click();
          
          await page.waitForTimeout(1000);
        }
      }
    }
    
  } catch (error) {
    console.log('⚠️  UI-based setup failed:', error.message);
    // Continue anyway - tests should handle missing data gracefully
  }
}

/**
 * Verify that critical pages are accessible
 */
async function verifyCriticalPages(page: any, baseURL: string) {
  const criticalPages = [
    { path: '/', name: 'Dashboard' },
    { path: '/chart-of-accounts', name: 'Chart of Accounts' },
    { path: '/general-ledger', name: 'General Ledger' },
    { path: '/financial-statements', name: 'Financial Statements' }
  ];
  
  for (const { path, name } of criticalPages) {
    try {
      console.log(`🔍 Verifying ${name} (${path})...`);
      
      const response = await page.goto(`${baseURL}${path}`, {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      if (!response || !response.ok()) {
        throw new Error(`Failed to load ${name}: ${response?.status()}`);
      }
      
      // Verify page has basic content
      const hasContent = await page.locator('main').first().isVisible() || 
                        await page.locator('body').first().isVisible() || 
                        await page.locator('[data-testid="main-content"]').first().isVisible();
      if (!hasContent) {
        throw new Error(`${name} page has no visible content`);
      }
      
      console.log(`✅ ${name} is accessible`);
      
    } catch (error) {
      console.error(`❌ ${name} verification failed:`, error.message);
      throw error;
    }
  }
}

/**
 * Clean up test data (called after all tests)
 */
export async function globalTeardown() {
  console.log('🧹 Starting global teardown...');
  
  try {
    // Clean up any test data if needed
    // This could involve API calls to reset the database
    // or other cleanup operations
    
    console.log('✅ Global teardown completed');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - teardown failures shouldn't fail the test run
  }
}

export default globalSetup;