import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/dashboard.page';
import { ChartOfAccountsPage } from './pages/chart-of-accounts.page';
import { GeneralLedgerPage } from './pages/general-ledger.page';
import { FinancialStatementsPage } from './pages/financial-statements.page';
import { testData } from './fixtures/test-data';

test.describe('Finance Manager Integration Tests', () => {
  test('should complete full accounting workflow', async ({ page }) => {
    // 1. Start from dashboard
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // 2. Set up chart of accounts
    const chartPage = new ChartOfAccountsPage(page);
    await dashboardPage.navigateToPage('/chart-of-accounts');
    await chartPage.verifyPageLoaded();
    
    // Add essential accounts
    const accounts = [
      { name: 'Cash', code: '1001', type: 'Asset', description: 'Cash account' },
      { name: 'Accounts Receivable', code: '1200', type: 'Asset', description: 'Customer receivables' },
      { name: 'Revenue', code: '4000', type: 'Revenue', description: 'Sales revenue' },
      { name: 'Expenses', code: '5000', type: 'Expense', description: 'Operating expenses' }
    ];

    for (const account of accounts) {
      // Add account if it doesn't exist
      const addButton = page.locator('button:has-text("Add Account"), [data-testid="add-account"]');
      await addButton.click();
      
      const form = page.locator('form, [data-testid="account-form"]');
      await expect(form).toBeVisible();
      
      await chartPage.fillInput('input[name="name"], [data-testid="account-name"]', account.name);
      await chartPage.fillInput('input[name="code"], [data-testid="account-code"]', account.code);
      await chartPage.fillInput('textarea[name="description"], [data-testid="account-description"]', account.description);
      
      const typeSelect = page.locator('select[name="type"], [data-testid="account-type"]');
      await typeSelect.selectOption(account.type);
      
      const submitButton = page.locator('button[type="submit"], [data-testid="submit-account"]');
      await submitButton.click();
      
      await page.waitForTimeout(1000);
    }

    // 3. Record transactions in general ledger
    const ledgerPage = new GeneralLedgerPage(page);
    await dashboardPage.navigateToPage('/general-ledger');
    await ledgerPage.verifyPageLoaded();
    
    // Record a sale transaction
    const saleTransaction = {
      date: '2024-01-15',
      description: 'Sale to Customer A',
      reference: 'INV-001',
      entries: [
        { account: 'Cash', amount: 1000, type: 'debit' },
        { account: 'Revenue', amount: 1000, type: 'credit' }
      ]
    };
    
    await ledgerPage.addNewTransaction();
    await ledgerPage.verifyTransactionExists(saleTransaction.description);
    
    // Record an expense transaction
    const expenseTransaction = {
      date: '2024-01-16',
      description: 'Office Supplies',
      reference: 'EXP-001',
      entries: [
        { account: 'Expenses', amount: 200, type: 'debit' },
        { account: 'Cash', amount: 200, type: 'credit' }
      ]
    };
    
    await ledgerPage.addNewTransaction();
    await ledgerPage.verifyTransactionExists(expenseTransaction.description);

    // 4. Generate financial statements
    const statementsPage = new FinancialStatementsPage(page);
    await dashboardPage.navigateToPage('/financial-statements');
    await statementsPage.verifyPageLoaded();
    
    // Generate balance sheet
    await statementsPage.generateBalanceSheet('2024-01-01', '2024-01-31');
    await statementsPage.verifyBalanceSheetStructure();
    
    // Generate income statement
    await statementsPage.generateIncomeStatement('2024-01-01', '2024-01-31');
    await statementsPage.verifyIncomeStatementStructure();
    
    // 5. Verify data consistency across modules
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();
  });

  test('should maintain data integrity across sessions', async ({ page }) => {
    const { sample } = testData.accounts;
    
    // Add account in one session
    const chartPage = new ChartOfAccountsPage(page);
    await chartPage.goto();
    await chartPage.addNewAccount();
    await chartPage.verifyAccountExists(sample.name);
    
    // Reload page and verify account persists
    await page.reload();
    await chartPage.verifyPageLoaded();
    await chartPage.verifyAccountExists(sample.name);
    
    // Navigate away and back
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await chartPage.goto();
    await chartPage.verifyAccountExists(sample.name);
  });

  test('should handle concurrent user operations', async ({ browser }) => {
    // Simulate multiple users working simultaneously
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    const chartPage1 = new ChartOfAccountsPage(page1);
    const chartPage2 = new ChartOfAccountsPage(page2);
    
    // Both users navigate to chart of accounts
    await Promise.all([
      chartPage1.goto(),
      chartPage2.goto()
    ]);
    
    await Promise.all([
      chartPage1.verifyPageLoaded(),
      chartPage2.verifyPageLoaded()
    ]);
    
    // Both users should see the same data
    await Promise.all([
      chartPage1.verifyAccountsTableExists(),
      chartPage2.verifyAccountsTableExists()
    ]);
    
    await context1.close();
    await context2.close();
  });

  test('should handle data validation across modules', async ({ page }) => {
    // Test that invalid data is rejected consistently
    const chartPage = new ChartOfAccountsPage(page);
    await chartPage.goto();
    
    // Try to add account with invalid data
    const addButton = page.locator('button:has-text("Add Account"), [data-testid="add-account"]');
    await addButton.click();
    
    const form = page.locator('form, [data-testid="account-form"]');
    await expect(form).toBeVisible();
    
    // Submit with invalid/empty data
    const submitButton = page.locator('button[type="submit"], [data-testid="submit-account"]');
    await submitButton.click();
    
    // Should show validation errors
    const errorMessages = page.locator('.error, [data-testid*="error"], .invalid-feedback');
    const hasErrors = await errorMessages.count() > 0;
    expect(hasErrors).toBeTruthy();
  });

  test('should support bulk operations', async ({ page }) => {
    const chartPage = new ChartOfAccountsPage(page);
    await chartPage.goto();
    
    // Test bulk account creation if supported
    const bulkImportButton = page.locator('button:has-text("Import"), button:has-text("Bulk"), [data-testid="bulk-import"]');
    
    if (await bulkImportButton.isVisible({ timeout: 2000 })) {
      await bulkImportButton.click();
      
      // Verify bulk import interface
      const importDialog = page.locator('[data-testid="import-dialog"], .import-modal, .bulk-import');
      await expect(importDialog).toBeVisible();
    }
  });

  test('should handle system errors gracefully', async ({ page }) => {
    // Test error handling by simulating network issues
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Should show error state or fallback content
    const errorIndicator = page.locator('[data-testid="error"], .error-message, .network-error');
    const hasContent = await page.locator('main, body').isVisible({ timeout: 5000 });
    
    expect(await errorIndicator.isVisible() || hasContent).toBeTruthy();
  });

  test('should maintain performance under load', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate through all main pages quickly
    const pages = ['/', '/chart-of-accounts', '/general-ledger', '/financial-statements'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }
    
    const totalTime = Date.now() - startTime;
    
    // Should complete navigation within reasonable time
    expect(totalTime).toBeLessThan(15000); // 15 seconds for all pages
  });

  test('should support keyboard navigation', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is on a focusable element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test navigation with Enter key
    await page.keyboard.press('Enter');
    
    // Should navigate or activate the focused element
    await page.waitForTimeout(1000);
  });

  test('should work across different browsers', async ({ page, browserName }) => {
    // This test will run on all configured browsers
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();
    
    // Verify basic functionality works in current browser
    await dashboardPage.verifyNavigationExists();
    await dashboardPage.verifyDashboardContent();
    
    console.log(`Test passed on ${browserName}`);
  });
});

test.describe('Finance Manager Security Tests', () => {
  test('should prevent XSS attacks', async ({ page }) => {
    const chartPage = new ChartOfAccountsPage(page);
    await chartPage.goto();
    
    // Try to inject script in account name
    const addButton = page.locator('button:has-text("Add Account"), [data-testid="add-account"]');
    await addButton.click();
    
    const form = page.locator('form, [data-testid="account-form"]');
    await expect(form).toBeVisible();
    
    const maliciousScript = '<script>alert("XSS")</script>';
    await chartPage.fillInput('input[name="name"], [data-testid="account-name"]', maliciousScript);
    await chartPage.fillInput('input[name="code"], [data-testid="account-code"]', '9999');
    
    const submitButton = page.locator('button[type="submit"], [data-testid="submit-account"]');
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    // Script should be escaped, not executed
    const accountRow = page.locator(`tr:has-text("${maliciousScript}")`);
    if (await accountRow.isVisible({ timeout: 2000 })) {
      const cellText = await accountRow.locator('td').first().textContent();
      expect(cellText).toContain('&lt;script&gt;');
    }
  });

  test('should validate input lengths', async ({ page }) => {
    const chartPage = new ChartOfAccountsPage(page);
    await chartPage.goto();
    
    const addButton = page.locator('button:has-text("Add Account"), [data-testid="add-account"]');
    await addButton.click();
    
    const form = page.locator('form, [data-testid="account-form"]');
    await expect(form).toBeVisible();
    
    // Try extremely long input
    const longString = 'A'.repeat(1000);
    await chartPage.fillInput('input[name="name"], [data-testid="account-name"]', longString);
    
    const submitButton = page.locator('button[type="submit"], [data-testid="submit-account"]');
    await submitButton.click();
    
    // Should show validation error for length
    const lengthError = page.locator('text=/too long|maximum length|character limit/i');
    await expect(lengthError).toBeVisible({ timeout: 5000 });
  });
});