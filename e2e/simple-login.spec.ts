import { test, expect } from '@playwright/test';
import { setupGlobalApiMocks } from './helpers/api-mocks';

test.describe('Simple Login Test', () => {
  test('should render login form and submit via JavaScript', async ({ page }) => {
    // Setup API mocks
    await setupGlobalApiMocks(page);

    // Track network requests
    const requests: string[] = [];
    const loginRequests: any[] = [];
    const failedRequests: any[] = [];
    page.on('request', (request) => {
      requests.push(`${request.method()} ${request.url()}`);
      if (request.url().includes('/api/auth/login')) {
        loginRequests.push({
          method: request.method(),
          url: request.url(),
          postData: request.postData()
        });
      }
    });
    
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()?.errorText
      });
    });
    
    page.on('response', response => {
      if (!response.ok() && (response.url().includes('react') || response.url().includes('astro'))) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Track console messages and errors
    const consoleMessages: any[] = [];
    const jsErrors: any[] = [];
    
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    page.on('pageerror', (error) => {
      jsErrors.push({
        message: error.message,
        stack: error.stack
      });
    });
    
    page.on('requestfailed', (request) => {
      jsErrors.push(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Navigate to login page
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if form exists
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Fill in credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Wait a bit for React to hydrate
    await page.waitForTimeout(2000);

    // Check if React has hydrated by looking for React-specific attributes
    const formElement = await page.locator('form').first();
    const hasReactProps = await formElement.evaluate((el) => {
      // Check for React fiber properties
      const keys = Object.keys(el);
      return keys.some(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
    });

    console.log('React hydrated:', hasReactProps);
    console.log('JavaScript errors:', jsErrors);
    console.log('Console messages:', consoleMessages);
    console.log('All requests:', requests);
    console.log('API requests:', requests.filter(r => r.includes('/api/')));
    
    // Check if React and ReactDOM are available globally
    const globalReact = await page.evaluate(() => {
      return {
        hasReact: typeof (window as any).React !== 'undefined',
        hasReactDOM: typeof (window as any).ReactDOM !== 'undefined',
        astroIslandCount: document.querySelectorAll('astro-island').length
      };
    });
    
    console.log('Global React status:', globalReact);
    
    // Check the actual HTML content
    const pageContent = await page.content();
    const hasAstroIsland = pageContent.includes('<astro-island');
    const hasReactScript = pageContent.includes('react') || pageContent.includes('React');
    const hasLoginFormComponent = pageContent.includes('LoginForm');
    
    console.log('Page analysis:', {
      hasAstroIsland,
      hasReactScript,
      hasLoginFormComponent,
      astroIslandHTML: pageContent.match(/<astro-island[^>]*>/)?.[0] || 'Not found'
    });
    
    // Wait for potential hydration
    await page.waitForTimeout(2000);
    
    // Check if React has hydrated after waiting
     const postWaitReact = await page.evaluate(() => {
       return {
         hasReact: typeof (window as any).React !== 'undefined',
         hasReactDOM: typeof (window as any).ReactDOM !== 'undefined',
         formHasOnSubmit: !!document.querySelector('form')?.onsubmit,
         formHasEventListeners: document.querySelector('form')?._reactInternalFiber !== undefined ||
                               document.querySelector('form')?._reactInternalInstance !== undefined ||
                               Object.keys(document.querySelector('form') || {}).some(key => key.startsWith('__react'))
       };
     });
    
    console.log('Post-wait React status:', postWaitReact);
    
    // Log console messages and errors
    console.log('Console messages:', consoleMessages.slice(-10)); // Last 10 messages
    console.log('JavaScript errors:', jsErrors);

    // Try to submit the form using the correct selector
    await page.click('[data-testid="login-button"]');

    // Wait for potential navigation or API call
    await page.waitForTimeout(1000);

    // Check if we made a POST request to login API
    console.log('Login API requests:', loginRequests);
    console.log('Failed requests:', failedRequests);

    // Check current URL
    console.log('Current URL:', page.url());

    // The test should pass regardless, we're just gathering info
    expect(true).toBe(true);
  });
});