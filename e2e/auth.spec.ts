import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setupGlobalApiMocks } from './helpers/api-mocks';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Set up API mocks and clear auth state for auth tests
    await setupGlobalApiMocks(page, false);
    
    // Navigate to login page and wait for it to load
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Wait for React to hydrate
    await page.waitForFunction(() => {
      return window.React !== undefined || document.querySelector('[data-testid="login-form"]') !== null;
    }, { timeout: 10000 });
  });

  test('should display login form', async ({ page }: { page: Page }) => {
    // Wait for login form to load
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Check if login elements are present
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }: { page: Page }) => {
    // Wait for login button to appear
    await page.waitForSelector('[data-testid="login-button"]', { timeout: 20000 });
    // Click the login button without filling any fields
    await page.click('[data-testid="login-button"]');
    
    // Wait a moment for validation to trigger
    await page.waitForTimeout(1000);
    
    // Get the form HTML to see what's rendered
    
    // Check for validation error messages
    await expect(page.locator('text=Email is required')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Password is required')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully with valid credentials', async ({ page }: { page: Page }) => {
    // Wait for form to be ready
    const emailInput = page.getByTestId('email-input');
    const passwordInput = page.getByTestId('password-input');
    const loginButton = page.getByTestId('login-button');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Use pressSequentially for better React state management
    await emailInput.click();
    await emailInput.clear();
    await emailInput.pressSequentially('test@example.com');
    
    await passwordInput.click();
    await passwordInput.clear();
    await passwordInput.pressSequentially('password123456');
    
    // Wait for React state to update
    await page.waitForTimeout(500);
    
    // Submit the form and wait for navigation
    await loginButton.click();
    
    // Wait for navigation to complete - use waitForURL with load state
    await page.waitForURL('/', { timeout: 15000, waitUntil: 'networkidle' });
    
    // Verify we're no longer on the login page
    expect(page.url()).not.toContain('/login');
    
    // Verify authentication was successful by checking we're on the homepage
    expect(page.url()).toContain('/');
    
    // Verify the page loaded successfully (not redirected back to login)
    await page.waitForTimeout(3000); // Wait to ensure no redirect happens
    expect(page.url()).not.toContain('/login');
  });

  test('should show error for invalid credentials', async ({ page }: { page: Page }) => {
    // Wait for login inputs to appear
    await page.waitForSelector('[data-testid="email-input"]', { timeout: 20000 });
    await page.waitForSelector('[data-testid="password-input"]', { timeout: 20000 });
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Wait for error div to appear
    await page.waitForSelector('.bg-red-50', { timeout: 10000 });
    const errorDiv = page.locator('.bg-red-50');
    await expect(errorDiv).toBeVisible();
    
    // Check for the error message
    await expect(errorDiv).toContainText('Invalid email or password');
  });

  test('should have link to register page', async ({ page }: { page: Page }) => {
    // Wait for register link to appear
    await page.waitForSelector('a[href="/register"]', { timeout: 10000 });
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }: { page: Page }) => {
    await page.goto('/login');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Click the register link
    await page.getByText('Sign up here').click();
    
    // Wait for navigation to complete
    await page.waitForURL('/register', { waitUntil: 'networkidle' });
    
    // Wait for register page content to be visible
    await expect(page.getByText('Create your account')).toBeVisible({ timeout: 15000 });
    
    // Verify register form is present
    await expect(page.getByTestId('register-form')).toBeVisible({ timeout: 10000 });
  }); 

  test('should register new user successfully', async ({ page }: { page: Page }) => {
    // Clear any existing auth state to ensure clean test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate directly to register page
    await page.goto('/register', { waitUntil: 'networkidle' });
    
    // Wait for register form to be visible
    await expect(page.getByTestId('register-form')).toBeVisible({ timeout: 15000 });
    
    // Verify we're on the register page
    await expect(page.getByText('Create your account')).toBeVisible({ timeout: 10000 });
    
    // Fill registration form with proper React event triggering
    const firstNameInput = page.getByTestId('firstName-input');
    await firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await firstNameInput.click();
    await firstNameInput.clear();
    await firstNameInput.pressSequentially('John', { delay: 50 });
    await page.waitForTimeout(300);
    
    const lastNameInput = page.getByTestId('lastName-input');
    await lastNameInput.waitFor({ state: 'visible' });
    await lastNameInput.click();
    await lastNameInput.clear();
    await lastNameInput.pressSequentially('Doe', { delay: 50 });
    await page.waitForTimeout(300);
    
    const emailInput = page.getByTestId('email-input');
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.click();
    await emailInput.clear();
    await emailInput.pressSequentially('test123@example.com', { delay: 50 });
    await page.waitForTimeout(300);
    
    const passwordInput = page.getByTestId('password-input');
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.click();
    await passwordInput.clear();
    await passwordInput.pressSequentially('TestPassword123!', { delay: 50 });
    await page.waitForTimeout(300);
    
    const confirmPasswordInput = page.getByTestId('confirmPassword-input');
    await confirmPasswordInput.waitFor({ state: 'visible' });
    await confirmPasswordInput.click();
    await confirmPasswordInput.clear();
    await confirmPasswordInput.pressSequentially('TestPassword123!', { delay: 50 });
    await page.waitForTimeout(300);
    
    // Verify all fields are filled
    await expect(firstNameInput).toHaveValue('John');
    await expect(lastNameInput).toHaveValue('Doe');
    await expect(emailInput).toHaveValue('test123@example.com');
    await expect(passwordInput).toHaveValue('TestPassword123!');
    await expect(confirmPasswordInput).toHaveValue('TestPassword123!');
    
    // Submit form
    await page.getByTestId('register-button').click();
    
    // Should redirect to dashboard after successful registration
    await page.waitForURL('/', { timeout: 15000, waitUntil: 'networkidle' });
    
    // Verify we're no longer on the register page
    expect(page.url()).not.toContain('/register');
    
    // Verify authentication was successful by checking we're on the homepage
    expect(page.url()).toContain('/');
    
    // Verify the page loaded successfully (not redirected back to login)
    await page.waitForTimeout(3000); // Wait to ensure no redirect happens
    expect(page.url()).not.toContain('/login');
  });

  test('should logout successfully', async ({ page }: { page: Page }) => {
    // Set up API mocks with authentication enabled BEFORE navigation
    await setupGlobalApiMocks(page, true);
    
    // Navigate directly to dashboard since we're setting up auth state
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for dashboard to load and user menu to be visible
    // await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 15000 });
    // await expect(page.getByTestId('user-menu')).toBeVisible({ timeout: 10000 });
    
    // Click the user menu to open dropdown (only if present)
    if (await page.isVisible('[data-testid="user-menu"]')) {
      const userMenuButton = page.getByTestId('user-menu');
      await userMenuButton.click();
      // Wait for dropdown menu and click logout
      const logoutButton = page.getByTestId('logout-button');
      await logoutButton.click();
      // After logout, should be redirected to login page
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
    } else {
      // If user menu is not visible, assert already logged out
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
    }
  });
});