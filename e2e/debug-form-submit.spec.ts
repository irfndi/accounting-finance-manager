import { test } from '@playwright/test';
import { E2EApiMocker } from './helpers/api-mocks';

test.describe('Debug Form Submission', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocks
    const apiMocker = new E2EApiMocker(page);
    await apiMocker.setupAllMocks();
  });

  test('should submit form and handle response', async ({ page }) => {
    let formSubmitted = false;
    let apiCalled = false;
    let apiResponse: any = null;
    let navigationOccurred = false;
    
    // Track form submission
    await page.addInitScript(() => {
      const originalSubmit = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = function() {
        console.log('Form submitted via submit()');
        (window as any).formSubmitted = true;
        return originalSubmit.call(this);
      };
      
      // Track form submit events
      document.addEventListener('submit', (e) => {
        console.log('Form submit event fired', e.target);
        (window as any).formSubmitted = true;
      });
    });
    
    // Track API calls
    page.on('request', request => {
      if (request.url().includes('/api/auth/login')) {
        console.log('🔍 Login API called:', request.url());
        apiCalled = true;
      }
    });
    
    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console error:', msg.text());
      }
    });
    
    // Track page errors
    page.on('pageerror', error => {
      console.log('💥 Page error:', error.message);
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/auth/login')) {
        console.log('📥 Login API response:', response.status());
        response.json().then(data => {
          apiResponse = data;
          console.log('📄 Response data:', data);
        }).catch(() => {});
      }
    });
    
    // Track navigation
    page.on('framenavigated', () => {
      console.log('🧭 Navigation occurred to:', page.url());
      navigationOccurred = true;
    });
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Clear storage after page load
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (error) {
      console.log('Could not clear storage:', error);
    }
    
    // Fill form with correct test password
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    
    // Check if form is valid before submission
    const formValid = await page.evaluate(() => {
      const form = document.querySelector('[data-testid="login-form"]') as HTMLFormElement;
      return form ? form.checkValidity() : false;
    });
    console.log('Form valid before submission:', formValid);
    
    // Add debugging for button click and form submission
    await page.evaluate(() => {
      const button = document.querySelector('[data-testid="login-button"]') as HTMLButtonElement;
      const form = document.querySelector('[data-testid="login-form"]') as HTMLFormElement;
      
      if (button) {
        button.addEventListener('click', (e) => {
          console.log('🖱️ Button clicked, event:', e);
          console.log('🖱️ Button disabled:', button.disabled);
          console.log('🖱️ Button type:', button.type);
        });
      }
      
      if (form) {
        form.addEventListener('submit', (e) => {
          console.log('📝 Form submit event triggered');
          console.log('📝 Event defaultPrevented:', e.defaultPrevented);
        });
      }
    });
    
    // Click submit and wait
    console.log('🖱️ About to click login button');
    await page.click('[data-testid="login-button"]');
    console.log('🖱️ Button clicked');
    
    // Wait for potential async operations
    await page.waitForTimeout(1000);
    console.log('⏰ Finished waiting');
    
    // Check form submission status
    formSubmitted = await page.evaluate(() => (window as any).formSubmitted);
    
    console.log('=== DEBUG RESULTS ===');
    console.log('Form submitted:', formSubmitted);
    console.log('API called:', apiCalled);
    console.log('API response:', apiResponse);
    console.log('Navigation occurred:', navigationOccurred);
    console.log('Current URL:', page.url());
    
    // Check if error message is visible
    const errorVisible = await page.locator('[data-testid="error-message"]').isVisible();
    console.log('Error message visible:', errorVisible);
    
    if (errorVisible) {
      const errorText = await page.locator('[data-testid="error-message"]').textContent();
      console.log('Error text:', errorText);
    }
    
    // Check localStorage for auth data
    const authData = await page.evaluate(() => {
      return {
        token: localStorage.getItem('finance_manager_token'),
        user: localStorage.getItem('finance_manager_user')
      };
    });
    console.log('Auth data in localStorage:', authData);
  });
});