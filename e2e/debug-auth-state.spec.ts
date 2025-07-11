import { test, expect } from '@playwright/test';
import { setupGlobalApiMocks } from './helpers/api-mocks';

test('debug auth.getState() vs localStorage', async ({ page }) => {
  // Set up API mocks
  await setupGlobalApiMocks(page);
  
  // Add debug logging for auth.getState()
  await page.addInitScript(() => {
    // Intercept auth.getState() calls
    Object.defineProperty(window, 'debugAuthState', {
      value: () => {
        // Directly check localStorage
        const directToken = localStorage.getItem('finance_manager_token');
        const directUser = localStorage.getItem('finance_manager_user');
        
        console.log('[DEBUG] Direct localStorage check:', {
          token: directToken,
          user: directUser,
          tokenExists: !!directToken,
          userExists: !!directUser,
          bothExist: !!(directToken && directUser)
        });
        
        // Try to import and call auth.getState() if available
        try {
          // We'll check this after import
          console.log('[DEBUG] Will check auth.getState() after import');
        } catch (e) {
          console.log('[DEBUG] Could not access auth:', e);
        }
        
        return {
          directToken,
          directUser,
          tokenExists: !!directToken,
          userExists: !!directUser,
          bothExist: !!(directToken && directUser)
        };
      }
    });
  });
  
  // Go to login page
  await page.goto('/login');
  
  // Wait for React hydration
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Login with valid credentials
  await page.click('[data-testid="email-input"]');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.click('[data-testid="password-input"]');
  await page.fill('[data-testid="password-input"]', 'password123456');
  await page.waitForTimeout(1000);
  
  // Click login button
  await page.click('[data-testid="login-button"]');
  
  // Wait for navigation to home
  await page.waitForURL('/', { timeout: 10000 });
  console.log('✅ Successfully navigated to homepage');
  
  // Wait for page to load completely
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Now debug the auth state
  const debugResult = await page.evaluate(() => {
    return (window as any).debugAuthState();
  });
  
  console.log('🔍 Debug auth state result:', debugResult);
  
  // Try to access the actual auth object and see what getState returns
  const authStateCheck = await page.evaluate(() => {
    try {
      // Try to access auth from global scope or module
      // Since we can't easily import the module in evaluate, 
      // let's check the storage helpers directly
      
      const tokenKey = 'finance_manager_token';
      const userKey = 'finance_manager_user';
      
      // Simulate what tokenStorage.get() and userStorage.get() do
      const getToken = () => {
        try {
          const value = localStorage.getItem(tokenKey);
          return value || null;
        } catch (error) {
          console.error('Token storage get error:', error);
          return null;
        }
      };
      
      const getUser = () => {
        try {
          const value = localStorage.getItem(userKey);
          return value ? JSON.parse(value) : null;
        } catch (error) {
          console.error('User storage get error:', error);
          return null;
        }
      };
      
      const token = getToken();
      const user = getUser();
      const isAuthenticated = !!(token && user);
      
      return {
        simulatedState: {
          token,
          user,
          isAuthenticated
        },
        rawLocalStorage: {
          token: localStorage.getItem(tokenKey),
          user: localStorage.getItem(userKey)
        }
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  
  console.log('🔍 Auth state simulation:', authStateCheck);
  
  // Check for user menu again
  const userMenuExists = await page.locator('[data-testid="user-menu"]').count();
  console.log('🔍 User menu elements found:', userMenuExists);
  
  expect(true).toBe(true);
}); 