import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('should load login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page title contains "Login"
    await expect(page).toHaveTitle(/Login.*Finance Manager/);
    
    // Check that login form is visible
    await expect(page.locator('form')).toBeVisible();
    
    // Check for email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for login button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should load homepage and redirect to login', async ({ page }) => {
    // Clear any existing auth state
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for potential redirect
    await page.waitForTimeout(2000);
    
    // Should either be on login page or show login form
    const currentUrl = page.url();
    const hasLoginForm = await page.locator('form').isVisible().catch(() => false);
    
    // Either URL contains login or login form is visible
    expect(currentUrl.includes('/login') || hasLoginForm).toBeTruthy();
  });


});