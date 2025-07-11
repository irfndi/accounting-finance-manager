import { test, expect } from '@playwright/test';

test.describe('Simple Register Page Test', () => {
  test('should navigate to register page', async ({ page }) => {
    console.log('Starting navigation test...');
    
    // Navigate to register page
    await page.goto('/register');
    console.log('Navigated to /register');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('Page loaded');
    
    // Check URL
    const url = page.url();
    console.log('Current URL:', url);
    expect(url).toContain('/register');
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-register-simple.png', fullPage: true });
    console.log('Screenshot taken');
    
    // Check if register form exists
    const registerForm = page.locator('form');
    await expect(registerForm).toBeVisible();
    console.log('Register form is visible');
    
    // Check for specific register page elements
    const createAccountText = page.locator('text=Create your account');
    if (await createAccountText.isVisible()) {
      console.log('"Create your account" text found');
    } else {
      console.log('"Create your account" text NOT found');
      
      // Log all visible text on the page
      const bodyText = await page.locator('body').textContent();
      console.log('Page body text:', bodyText?.substring(0, 500));
    }
  });
});