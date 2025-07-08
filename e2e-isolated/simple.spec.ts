import { test, expect } from '@playwright/test';

// Simple isolated test to verify Playwright works without interference
test.describe('Simple Isolated Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Finance Manager/);
    
    // Check for basic HTML structure
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport on login page (since homepage redirects to login)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check that form elements are visible on mobile
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    
    await expect(body).toBeVisible();
     await expect(emailInput).toBeVisible();
   });

   test('should handle authentication flow', async ({ page }) => {
    // Test direct navigation to login page
    await page.goto('/login');
    
    // Check that login page loads correctly
    await expect(page).toHaveTitle(/Login.*Finance Manager/);
    
    // Check for login form elements
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.getByLabel(/password/i);
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Test navigation to register page
    const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register.*/);
    }
   });
});