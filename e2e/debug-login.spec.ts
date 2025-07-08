import { test } from '@playwright/test';
import { setupGlobalApiMocks } from './helpers/api-mocks';

test.describe('Debug Login', () => {
  test.beforeEach(async ({ page }) => {
    await setupGlobalApiMocks(page);
  });

  test('debug form submission', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    // Listen for all requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(`${request.method()} ${request.url()}`);
      console.log(`🌐 Request: ${request.method()} ${request.url()}`);
      if (request.method() === 'POST') {
        console.log(`📤 POST Body:`, request.postData());
      }
    });
    
    page.on('response', response => {
      console.log(`📥 Response: ${response.status()} ${response.url()}`);
    });
    
    // Listen for console messages
    page.on('console', msg => {
      console.log(`🖥️ Console ${msg.type()}: ${msg.text()}`);
    });
    
    // Listen for JavaScript errors
    page.on('pageerror', error => {
      console.log(`❌ JS Error: ${error.message}`);
      console.log(`❌ JS Error Stack: ${error.stack}`);
    });
    
    console.log('🌐 Current URL before submit:', page.url());
    
    // Check if React is loaded and if component is hydrated
    const reactInfo = await page.evaluate(() => {
      const form = document.querySelector('[data-testid="login-form"]') as any;
      const win = window as any;
      const hasReact = typeof win.React !== 'undefined';
      const hasReactDOM = typeof win.ReactDOM !== 'undefined';
      const formHasReactProps = form && (form._reactInternalFiber !== undefined || form._reactInternalInstance !== undefined || form.__reactInternalInstance !== undefined);
      
      // Check if form has submit event listener
      const hasSubmitHandler = form && typeof form.onsubmit === 'function';
      
      return {
        hasReact,
        hasReactDOM,
        formHasReactProps,
        formExists: !!form,
        hasSubmitHandler
      };
    }).catch(() => ({
      hasReact: false,
      hasReactDOM: false,
      formHasReactProps: false,
      formExists: false,
      hasSubmitHandler: false
    }));
    
    console.log('⚛️ React info:', reactInfo);
    
    // Check if the form has an action attribute (which would cause native submission)
    const formAction = await page.getAttribute('[data-testid="login-form"]', 'action');
    console.log('📝 Form action attribute:', formAction);
    
    // Check if the form has a method attribute
    const formMethod = await page.getAttribute('[data-testid="login-form"]', 'method');
    console.log('📝 Form method attribute:', formMethod);
    
    // Click submit button
    await page.click('[data-testid="login-button"]');
    
    // Wait a bit to see what happens
    await page.waitForTimeout(2000);
    
    console.log('🌐 Current URL after submit:', page.url());
    console.log('📋 All requests made:', requests);
    
    // Check if we made a POST request to login API
    const loginRequests = requests.filter(req => req.includes('POST') && req.includes('/api/auth/login'));
    console.log('🔍 Login API requests:', loginRequests);
    
    if (loginRequests.length === 0) {
      console.log('❌ No POST request to /api/auth/login was made');
      
      // Check if form is still visible
      const formVisible = await page.isVisible('[data-testid="login-form"]');
      console.log('📝 Form still visible:', formVisible);
      
      // Check for any error messages
      const errorVisible = await page.isVisible('[data-testid="error-message"]');
      console.log('⚠️ Error message visible:', errorVisible);
      
      if (errorVisible) {
        const errorText = await page.textContent('[data-testid="error-message"]');
        console.log('⚠️ Error message text:', errorText);
      }
    }
  });
});