import { test, expect } from '@playwright/test';
import { setupGlobalApiMocks, E2EApiMocker } from './helpers/api-mocks';

test.describe('Chart of Accounts - Simple', () => {
  let _apiMocker: E2EApiMocker;

  test.beforeEach(async ({ page }) => {
    // Set up API mocks
    _apiMocker = await setupGlobalApiMocks(page);
    
    // Set up authentication state in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('finance_manager_token', 'mock-jwt-token');
      localStorage.setItem('finance_manager_user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        createdAt: new Date().toISOString()
      }));
    });
  });

  test('should load chart of accounts page without errors', async ({ page }) => {
    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the page
    await page.goto('/chart-of-accounts');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the right page
    await expect(page).toHaveTitle(/Chart of Accounts/);
    
    // Check for any console errors
    expect(consoleErrors).toEqual([]);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/chart-of-accounts-simple.png', fullPage: true });
    
    // Log the page content for debugging
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
    console.log('Has chart-title element:', await page.locator('[data-testid="chart-title"]').count());
    console.log('Has add-account-button element:', await page.locator('[data-testid="add-account-button"]').count());
    console.log('Has nav-title element:', await page.locator('[data-testid="nav-title"]').count());
  });

  test('should render chart title and add button with shorter timeout', async ({ page }) => {
    await page.goto('/chart-of-accounts');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Use shorter timeouts and more specific selectors
    await expect(page.locator('[data-testid="chart-title"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="add-account-button"]')).toBeVisible({ timeout: 5000 });
  });
});