import { test, expect } from '@playwright/test';
import { setupGlobalApiMocks } from './helpers/api-mocks';

test.describe('Hydration Debug', () => {
  test.beforeEach(async ({ page }) => {
    await setupGlobalApiMocks(page);
  });

  test('check React hydration', async ({ page }) => {
    // Capture all console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
      jsErrors.push(`${error.name}: ${error.message}`);
    });

    // Navigate to login page
    await page.goto('/login');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for hydration
    
    // Check if React components are loaded
    const reactStatus = await page.evaluate(() => {
      const win = window as any;
      return {
        hasReact: typeof win.React !== 'undefined',
        hasReactDOM: typeof win.ReactDOM !== 'undefined',
        formExists: !!document.querySelector('[data-testid="login-form"]'),
        buttonExists: !!document.querySelector('[data-testid="login-button"]'),
        emailInputExists: !!document.querySelector('[data-testid="email-input"]'),
        passwordInputExists: !!document.querySelector('[data-testid="password-input"]')
      };
    });

    console.log('React Status:', JSON.stringify(reactStatus, null, 2));
    console.log('Console Messages:', consoleMessages);
    console.log('JavaScript Errors:', jsErrors);

    // Try to interact with the form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    // Check if form values are set
    const emailValue = await page.inputValue('[data-testid="email-input"]');
    const passwordValue = await page.inputValue('[data-testid="password-input"]');
    
    console.log('Form Values:', { email: emailValue, password: passwordValue });
    
    // Check if clicking the button triggers any events
    let formSubmitted = false;
    page.on('request', request => {
      if (request.method() === 'POST' && request.url().includes('/api/auth/login')) {
        formSubmitted = true;
      }
    });
    
    await page.click('[data-testid="login-button"]');
    await page.waitForTimeout(2000);
    
    console.log('Form submitted via API:', formSubmitted);
    console.log('Current URL after click:', page.url());
    
    // Expect basic elements to exist
    expect(reactStatus.formExists).toBe(true);
    expect(reactStatus.buttonExists).toBe(true);
    expect(reactStatus.emailInputExists).toBe(true);
    expect(reactStatus.passwordInputExists).toBe(true);
  });
});