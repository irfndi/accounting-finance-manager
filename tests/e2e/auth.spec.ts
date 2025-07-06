import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    // Check if login elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Fill in invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check for validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should attempt login with valid credentials', async ({ page }) => {
    // Fill in valid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for either success redirect or error message
    // This will depend on your actual implementation
    await page.waitForTimeout(2000); // Adjust based on your app
  });

  test('should have register link', async ({ page }) => {
    await expect(page.locator('text=Sign up')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Sign up');
    await expect(page.url()).toContain('/register');
  });
}); 