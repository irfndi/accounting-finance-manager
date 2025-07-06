import { test, expect } from '@playwright/test';

test.describe('Example Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Basic check that the page loads
    await expect(page).toHaveTitle(/Finance Manager|Corporate Finance/);
  });

  test('should have basic HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic HTML elements
    await expect(page.locator('html')).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Basic responsiveness check
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });
}); 