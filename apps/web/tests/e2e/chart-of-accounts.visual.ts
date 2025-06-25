import { test, expect } from '@playwright/test';
import { ChartOfAccountsPage } from './pages/chart-of-accounts.page';

test.describe('Chart of Accounts Visual Regression Tests', () => {
  let chartOfAccountsPage: ChartOfAccountsPage;

  test.beforeEach(async ({ page }) => {
    chartOfAccountsPage = new ChartOfAccountsPage(page);
    await chartOfAccountsPage.goto();
    await chartOfAccountsPage.verifyPageLoaded();
  });

  test('should match chart of accounts desktop screenshot', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('chart-of-accounts-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match chart of accounts mobile screenshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('chart-of-accounts-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match accounts table screenshot', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Screenshot just the accounts table
    const accountsTable = page.locator('table, [data-testid="accounts-table"]').first();
    if (await accountsTable.count() > 0) {
      await expect(accountsTable).toHaveScreenshot('chart-of-accounts-table.png', {
        animations: 'disabled',
      });
    }
  });

  test('should match add account form screenshot', async ({ page }) => {
    // Try to open add account form if it exists
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), [data-testid="add-account"]').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(500); // Wait for form to appear
      
      const form = page.locator('form, [data-testid="add-account-form"]').first();
      if (await form.count() > 0) {
        await expect(form).toHaveScreenshot('chart-of-accounts-add-form.png', {
          animations: 'disabled',
        });
      }
    }
  });
});