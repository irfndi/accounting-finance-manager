import { test, expect } from '@playwright/test';
import { E2EAuthHelper, cleanupAuth } from './helpers/auth';
import { setupGlobalApiMocks, E2EApiMocker } from './helpers/api-mocks';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await cleanupAuth(page);
    
    // Setup API mocks using the proper mocker
    await setupGlobalApiMocks(page);
    
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Wait for login form to load
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Check if login elements are present
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Wait for login button to appear
    await page.waitForSelector('[data-testid="login-button"]', { timeout: 20000 });
    // Click the login button without filling any fields
    await page.click('[data-testid="login-button"]');
    
    // Wait a moment for validation to trigger
    await page.waitForTimeout(1000);
    
    // Take a screenshot to debug
    await page.screenshot({ path: 'debug-validation.png', fullPage: true });
    
    // Get the form HTML to see what's rendered
    const formHTML = await page.locator('[data-testid="login-form"]').innerHTML();
    console.log('Form HTML after submit:', formHTML);
    
    // Check for validation error messages
    await expect(page.locator('text=Email is required')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Password is required')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    let apiRequestMade = false;
    let apiResponse: any = null;
    const consoleMessages: string[] = [];
    const jsErrors: string[] = [];

    // Capture console messages and JS errors
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log('🖥️ Console:', msg.type(), msg.text());
    });

    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.log('❌ JS Error:', error.message);
    });

    // Debug: Log ALL requests to see what's happening
    page.on('request', request => {
      console.log('🌐 Request:', request.method(), request.url());
      if (request.url().includes('/api/auth/login')) {
        console.log('🔍 Intercepted login request:', request.url(), request.method());
        console.log('📤 Request body:', request.postData());
        apiRequestMade = true;
      }
    });

    // Debug: Log ALL responses
    page.on('response', response => {
      console.log('📥 Response:', response.status(), response.url());
      if (response.url().includes('/api/auth/login')) {
        console.log('📥 Login response:', response.status(), response.url());
        response.json().then(data => {
          apiResponse = data;
          console.log('📄 Response data:', data);
        }).catch(() => {});
      }
    });

    await page.goto('/login');
    
    // Fill in the form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123456');
    
    // Debug: Check form state before submission
    const emailValue = await page.inputValue('[data-testid="email-input"]');
    const passwordValue = await page.inputValue('[data-testid="password-input"]');
    console.log('📝 Form values before submit:', { email: emailValue, password: passwordValue });
    
    console.log('🖱️ Clicking login button...');
    await page.click('[data-testid="login-button"]');
    
    // Wait for any async operations
    await page.waitForTimeout(3000);
    
    console.log('🌐 Current URL after submission:', page.url());
    console.log('🔍 API request made:', apiRequestMade);
    console.log('📄 API response:', apiResponse);
    console.log('🖥️ Console messages:', consoleMessages.slice(-10)); // Last 10 messages
    console.log('❌ JS errors:', jsErrors);
    
    // Check if we navigated successfully
    if (page.url().includes('/login')) {
      // Still on login page, check for errors
      const errorElement = page.locator('[data-testid="error-message"]');
      const hasError = await errorElement.isVisible();
      
      if (hasError) {
        const errorText = await errorElement.textContent();
        throw new Error(`Login failed with error: ${errorText}`);
      }
      
      throw new Error('Form submission failed - still on login page');
    }
    
    // Verify we're on the home page
    await expect(page).toHaveURL('/');
  });

  test('should show error for invalid credentials', async ({ page }) => {
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

  test('should have link to register page', async ({ page }) => {
    // Wait for register link to appear
    await page.waitForSelector('a[href="/register"]', { timeout: 10000 });
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Wait for register link to appear
    await page.waitForSelector('a[href="/register"]', { timeout: 10000 });
    await page.click('a[href="/register"]');
    
    await expect(page).toHaveURL('/register');
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register');
    
    // Wait for registration inputs to appear (after hydration)
    await page.waitForSelector('[data-testid="firstName-input"]', { timeout: 20000 });
    
    const uniqueEmail = `test${Date.now()}@example.com`;
    
    await page.fill('[data-testid="firstName-input"]', 'Test');
    await page.fill('[data-testid="lastName-input"]', 'User');
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="confirmPassword-input"]', 'TestPassword123!');
    await page.click('[data-testid="register-button"]');
    
    await expect(page).toHaveURL('/');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    const authHelper = new E2EAuthHelper(page);
    const testUser = await authHelper.createTestUser();
    await authHelper.loginViaUI(testUser.email, testUser.password);
    
    // Ensure user menu is visible before interacting
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
    
    // Should be on the dashboard (home page)
    await expect(page).toHaveURL('/');
    
    // Open user menu and click logout
    await page.click('[data-testid="user-menu"]');
    await page.waitForSelector('[data-testid="logout-button"]', { timeout: 5000 });
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });
});