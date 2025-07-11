import { test, expect } from '@playwright/test';

test.describe('Application Tests', () => {
  test('should load homepage (redirects to login)', async ({ page }) => {
    // Clear any existing authentication state
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto('/');
    
    // Wait for the AuthGuard to check authentication and redirect
    // Since this is a client-side redirect, we need to wait for the React component to load
    await page.waitForFunction(() => {
      return window.location.pathname === '/login' || 
             document.querySelector('[data-testid="login-form"]') !== null ||
             document.querySelector('h1')?.textContent?.includes('Login') ||
             document.title.includes('Login');
    }, { timeout: 30000 });
    
    // Check that we're either on login page or login form is visible
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page).toHaveTitle(/Login.*Finance Manager/);
    } else {
      // If still on homepage, check for login form or redirection message
      const hasLoginForm = await page.locator('[data-testid="login-form"]').isVisible().catch(() => false);
      const hasRedirectMessage = await page.locator('text=Redirecting to login').isVisible().catch(() => false);
      expect(hasLoginForm || hasRedirectMessage).toBeTruthy();
    }
  });

  test('should load login page directly', async ({ page }) => {
    await page.goto('/login');
    // Wait for login form to hydrate and be visible
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 20000 });
    
    // Check that login page loads correctly
    await expect(page).toHaveTitle(/Login.*Finance Manager/);
    
    // Check for login form elements
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.getByLabel(/password/i);
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('should be responsive on login page', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    // Wait for login form on mobile
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 20000 });
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 20000 });
    await expect(emailInput).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    // Wait for register link to be visible
    await page.waitForSelector('a[href="/register"]', { timeout: 10000 });
    
    // Test navigation to register page
    const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register.*/);
      // Wait for register form to hydrate
      await page.waitForSelector('[data-testid="register-form"]', { timeout: 20000 });
      await expect(page).toHaveTitle(/Register.*Finance Manager/);
    }
  });
});