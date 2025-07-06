import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard - adjust based on your auth flow
    await page.goto('/dashboard');
  });

  test('should display main navigation', async ({ page }) => {
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Accounts')).toBeVisible();
    await expect(page.locator('text=Transactions')).toBeVisible();
    await expect(page.locator('text=Budgets')).toBeVisible();
    await expect(page.locator('text=Reports')).toBeVisible();
  });

  test('should display financial summary cards', async ({ page }) => {
    // Check for financial summary elements
    await expect(page.locator('[data-testid="total-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-liabilities"]')).toBeVisible();
    await expect(page.locator('[data-testid="net-worth"]')).toBeVisible();
  });

  test('should navigate to accounts page', async ({ page }) => {
    await page.click('text=Accounts');
    await expect(page.url()).toContain('/accounts');
  });

  test('should navigate to transactions page', async ({ page }) => {
    await page.click('text=Transactions');
    await expect(page.url()).toContain('/transactions');
  });

  test('should navigate to budgets page', async ({ page }) => {
    await page.click('text=Budgets');
    await expect(page.url()).toContain('/budgets');
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.click('text=Reports');
    await expect(page.url()).toContain('/reports');
  });

  test('should display recent transactions', async ({ page }) => {
    // Check for recent transactions section
    await expect(page.locator('text=Recent Transactions')).toBeVisible();
    
    // Check if transaction list is present (even if empty)
    await expect(page.locator('[data-testid="transactions-list"]')).toBeVisible();
  });

  test('should allow creating new transaction', async ({ page }) => {
    // Look for add transaction button
    const addButton = page.locator('button:has-text("Add Transaction")');
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Check if transaction form appears
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[name="amount"]')).toBeVisible();
      await expect(page.locator('select[name="account"]')).toBeVisible();
    }
  });
}); 