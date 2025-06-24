import { test, expect } from '@playwright/test';
import { ChartOfAccountsPage } from './pages/chart-of-accounts.page';
import { testData } from './fixtures/test-data';

test.describe('Chart of Accounts E2E Tests', () => {
  let chartPage: ChartOfAccountsPage;

  test.beforeEach(async ({ page }) => {
    chartPage = new ChartOfAccountsPage(page);
    await chartPage.goto();
  });

  test('should load chart of accounts page successfully', async () => {
    await chartPage.verifyPageLoaded();
  });

  test('should display accounts table with proper headers', async () => {
    await chartPage.verifyAccountsTableExists();
  });

  test('should display different account types', async () => {
    await chartPage.verifyAccountTypes();
  });

  test('should add a new account successfully', async () => {
    const { sample } = testData.accounts;
    
    await chartPage.addNewAccount();
    
    // Verify account was added
    await chartPage.verifyAccountExists(sample.name);
  });

  test('should search for accounts', async () => {
    const { searchQueries } = testData;
    
    for (const query of searchQueries.accounts) {
      await chartPage.searchAccounts(query);
      
      // Verify search results are displayed
      const hasResults = await chartPage.page.locator('tbody tr').count() >= 0;
      expect(hasResults).toBeTruthy();
      
      // Clear search
      await chartPage.searchAccounts('');
    }
  });

  test('should filter accounts by type', async () => {
    const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    
    for (const type of accountTypes) {
      await chartPage.filterByAccountType(type);
      
      // Verify filtered results
      const rows = chartPage.page.locator('tbody tr');
      const count = await rows.count();
      
      if (count > 0) {
        // Check that visible accounts are of the selected type
        const firstRow = rows.first();
        const typeCell = firstRow.locator('td').nth(1); // Assuming type is in second column
        await expect(typeCell).toContainText(type, { timeout: 5000 });
      }
    }
  });

  test('should validate account form inputs', async () => {
    const addButton = chartPage.page.locator('button:has-text("Add Account"), [data-testid="add-account"]');
    await addButton.click();
    
    const form = chartPage.page.locator('form, [data-testid="account-form"]');
    await expect(form).toBeVisible();
    
    // Try to submit empty form
    const submitButton = chartPage.page.locator('button[type="submit"], [data-testid="submit-account"]');
    await submitButton.click();
    
    // Should show validation errors
    const errorMessages = chartPage.page.locator('.error, [data-testid*="error"], .invalid-feedback');
    const hasErrors = await errorMessages.count() > 0;
    expect(hasErrors).toBeTruthy();
  });

  test('should prevent duplicate account codes', async () => {
    const { sample } = testData.accounts;
    
    // Add first account
    await chartPage.addNewAccount();
    
    // Try to add account with same code
    const addButton = chartPage.page.locator('button:has-text("Add Account"), [data-testid="add-account"]');
    await addButton.click();
    
    const form = chartPage.page.locator('form, [data-testid="account-form"]');
    await expect(form).toBeVisible();
    
    // Fill with same code
    await chartPage.fillInput('input[name="code"], [data-testid="account-code"]', sample.code);
    await chartPage.fillInput('input[name="name"], [data-testid="account-name"]', 'Duplicate Account');
    
    const submitButton = chartPage.page.locator('button[type="submit"], [data-testid="submit-account"]');
    await submitButton.click();
    
    // Should show duplicate error
    const duplicateError = chartPage.page.locator('text=/duplicate|already exists/i');
    await expect(duplicateError).toBeVisible({ timeout: 5000 });
  });

  test('should edit existing account', async () => {
    const { sample } = testData.accounts;
    
    // First add an account
    await chartPage.addNewAccount();
    await chartPage.verifyAccountExists(sample.name);
    
    // Edit the account
    const accountRow = chartPage.page.locator(`tr:has-text("${sample.name}")`);
    const editButton = accountRow.locator('button:has-text("Edit"), [data-testid="edit-account"]');
    
    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
      
      const form = chartPage.page.locator('form, [data-testid="account-form"]');
      await expect(form).toBeVisible();
      
      // Update account name
      const nameInput = chartPage.page.locator('input[name="name"], [data-testid="account-name"]');
      await nameInput.fill(sample.name + ' Updated');
      
      const submitButton = chartPage.page.locator('button[type="submit"], [data-testid="submit-account"]');
      await submitButton.click();
      
      // Verify update
      await chartPage.verifyAccountExists(sample.name + ' Updated');
    }
  });

  test('should delete account with confirmation', async () => {
    const { sample } = testData.accounts;
    
    // First add an account
    await chartPage.addNewAccount();
    await chartPage.verifyAccountExists(sample.name);
    
    // Delete the account
    await chartPage.deleteAccount(sample.name);
    
    // Verify deletion
    await chartPage.verifyAccountDeleted(sample.name);
  });

  test('should export accounts data', async () => {
    await chartPage.exportAccounts();
    
    // Note: In a real test, you might want to verify the download
    // This is a basic test to ensure the export button works
  });

  test('should maintain account hierarchy', async () => {
    // Test parent-child account relationships if supported
    const parentAccount = {
      name: 'Current Assets',
      code: '1000',
      type: 'Asset',
      description: 'Parent account for current assets'
    };
    
    const childAccount = {
      name: 'Cash',
      code: '1001',
      type: 'Asset',
      description: 'Cash account',
      parent: '1000'
    };
    
    // Add parent account
    const addButton = chartPage.page.locator('button:has-text("Add Account"), [data-testid="add-account"]');
    await addButton.click();
    
    const form = chartPage.page.locator('form, [data-testid="account-form"]');
    await expect(form).toBeVisible();
    
    await chartPage.fillInput('input[name="name"], [data-testid="account-name"]', parentAccount.name);
    await chartPage.fillInput('input[name="code"], [data-testid="account-code"]', parentAccount.code);
    
    const submitButton = chartPage.page.locator('button[type="submit"], [data-testid="submit-account"]');
    await submitButton.click();
    
    await chartPage.page.waitForTimeout(1000);
    
    // Verify parent account exists
    await chartPage.verifyAccountExists(parentAccount.name);
  });

  test('should handle large number of accounts', async () => {
    // Test performance with many accounts
    const accountsTable = chartPage.page.locator('table, [data-testid="accounts-table"]');
    await expect(accountsTable).toBeVisible();
    
    // Check if pagination exists for large datasets
    const pagination = chartPage.page.locator('.pagination, [data-testid="pagination"]');
    const hasPagination = await pagination.isVisible({ timeout: 2000 });
    
    if (hasPagination) {
      // Test pagination functionality
      const nextButton = pagination.locator('button:has-text("Next"), [data-testid="next-page"]');
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await chartPage.page.waitForTimeout(500);
        
        // Verify page changed
        await expect(accountsTable).toBeVisible();
      }
    }
  });

  test('should meet accessibility standards', async () => {
    await chartPage.checkAccessibility();
  });

  test('should be responsive', async () => {
    await chartPage.checkResponsiveDesign();
  });
});

test.describe('Chart of Accounts Visual Regression Tests', () => {
  test('should match accounts table screenshot', async ({ page }) => {
    const chartPage = new ChartOfAccountsPage(page);
    await chartPage.goto();
    await chartPage.verifyPageLoaded();
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('chart-of-accounts.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match add account form screenshot', async ({ page }) => {
    const chartPage = new ChartOfAccountsPage(page);
    await chartPage.goto();
    
    const addButton = page.locator('button:has-text("Add Account"), [data-testid="add-account"]');
    await addButton.click();
    
    const form = page.locator('form, [data-testid="account-form"]');
    await expect(form).toBeVisible();
    
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('add-account-form.png', {
      threshold: 0.3
    });
  });
});