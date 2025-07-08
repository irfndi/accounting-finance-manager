import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard - authentication is handled by storage state
    await page.goto('/dashboard');
    // Wait for sidebar navigation to hydrate
    await page.waitForSelector('[data-testid="nav-title"]', { timeout: 20000 });
  });

  test('should display main navigation', async ({ page }) => {
    // Check for main navigation elements (hydrogen loaded)
    await page.waitForSelector('nav', { timeout: 20000 });
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Accounts')).toBeVisible();
    await expect(page.locator('text=Transactions')).toBeVisible();
    await expect(page.locator('text=Budgets')).toBeVisible();
    await expect(page.locator('text=Reports')).toBeVisible();
  });

  test('should display financial summary cards', async ({ page }) => {
    // Wait for summary cards to load
    await page.waitForSelector('[data-testid="total-assets"]', { timeout: 20000 });
    await expect(page.locator('[data-testid="total-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-liabilities"]')).toBeVisible();
    await expect(page.locator('[data-testid="net-worth"]')).toBeVisible();
  });

  test('should navigate to accounts page', async ({ page }) => {
    // Ensure navigation available
    await page.waitForSelector('text=Accounts', { timeout: 20000 });
    await page.click('text=Accounts');
    await expect(page.url()).toContain('/accounts');
  });

  test('should navigate to transactions page', async ({ page }) => {
    await page.waitForSelector('text=Transactions', { timeout: 20000 });
    await page.click('text=Transactions');
    await expect(page.url()).toContain('/transactions');
  });

  test('should navigate to budgets page', async ({ page }) => {
    await page.waitForSelector('text=Budgets', { timeout: 20000 });
    await page.click('text=Budgets');
    await expect(page.url()).toContain('/budgets');
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.waitForSelector('text=Reports', { timeout: 20000 });
    await page.click('text=Reports');
    await expect(page.url()).toContain('/reports');
  });

  test('should display recent transactions', async ({ page }) => {
    // Check for recent transactions section
    await page.waitForSelector('text=Recent Transactions', { timeout: 20000 });
    await expect(page.locator('text=Recent Transactions')).toBeVisible();
    
    // Check if transaction list is present (even if empty)
    await expect(page.locator('[data-testid="transactions-list"]')).toBeVisible();
  });

  test('should allow creating new transaction', async ({ page }) => {
    // Look for add transaction button
    const addButton = page.locator('button:has-text("Add Transaction")');
    // Wait for add button to appear
    if (await addButton.waitFor({ state: 'visible', timeout: 20000 })) {
      await addButton.click();
      
      // Check if transaction form appears
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[name="amount"]')).toBeVisible();
      await expect(page.locator('select[name="account"]')).toBeVisible();
    }
  });
});