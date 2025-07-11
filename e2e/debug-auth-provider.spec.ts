import { test, expect } from '@playwright/test';
import { setupGlobalApiMocks } from './helpers/api-mocks';

test('debug AuthProvider refreshAuth execution', async ({ page }) => {
  // Set up API mocks
  await setupGlobalApiMocks(page);
  
  // Add comprehensive logging to track AuthProvider behavior
  await page.addInitScript(() => {
    // Track useEffect calls
    let useEffectCount = 0;
    
    // Override console methods to catch AuthProvider logging
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function(...args) {
      originalLog.apply(console, ['[LOG]', ...args]);
    };
    
    console.error = function(...args) {
      originalError.apply(console, ['[ERROR]', ...args]);
    };
    
    console.warn = function(...args) {
      originalWarn.apply(console, ['[WARN]', ...args]);
    };
    
    // Try to inject logging into React components
    // This is tricky in the browser context, but let's try to hook into common React patterns
    const originalCreateElement = React?.createElement;
    if (originalCreateElement) {
      React.createElement = function(type, props, ...children) {
        if (typeof type === 'function' && type.name === 'AuthGuard') {
          console.log('[REACT] AuthGuard component created');
        }
        if (typeof type === 'function' && type.name === 'UserSection') {
          console.log('[REACT] UserSection component created');
        }
        return originalCreateElement.call(this, type, props, ...children);
      };
    }
    
    // Also hook into useEffect
    const originalUseEffect = React?.useEffect;
    if (originalUseEffect) {
      React.useEffect = function(effect, deps) {
        useEffectCount++;
        console.log(`[REACT] useEffect #${useEffectCount} called with deps:`, deps);
        
        // Wrap the effect to log when it runs
        const wrappedEffect = function() {
          console.log(`[REACT] useEffect #${useEffectCount} executing`);
          try {
            const result = effect();
            if (result && typeof result.then === 'function') {
              console.log(`[REACT] useEffect #${useEffectCount} returned a promise`);
              return result.catch(e => {
                console.error(`[REACT] useEffect #${useEffectCount} promise rejected:`, e);
                throw e;
              });
            }
            return result;
          } catch (e) {
            console.error(`[REACT] useEffect #${useEffectCount} threw error:`, e);
            throw e;
          }
        };
        
        return originalUseEffect.call(this, wrappedEffect, deps);
      };
    }
    
    // Track any errors that might be thrown
    window.addEventListener('error', (e) => {
      console.error('[WINDOW ERROR]', e.error, e.message);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      console.error('[UNHANDLED REJECTION]', e.reason);
    });
  });
  
  // Track console messages
  page.on('console', msg => {
    console.log(`🖥️ ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Track errors
  page.on('pageerror', error => {
    console.log('❌ PAGE ERROR:', error.message);
  });
  
  // Go to login page
  await page.goto('/login');
  
  // Wait for React hydration
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('=== LOGIN PHASE ===');
  
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
  
  console.log('=== HOMEPAGE LOADING ===');
  
  // Wait for page to load completely and let React do its thing
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Reduced wait for React effects
  
  console.log('=== CHECKING RESULTS ===');
  
  // Check if any React components were created
  const componentCheck = await page.evaluate(() => {
    // Look for any AuthProvider or UserSection related elements in DOM
    const authElements = document.querySelectorAll('[data-auth]');
    const userElements = document.querySelectorAll('[data-user]');
    const menuElements = document.querySelectorAll('[data-testid*="menu"]');
    const navElements = document.querySelectorAll('nav');
    
    return {
      authElementsCount: authElements.length,
      userElementsCount: userElements.length,
      menuElementsCount: menuElements.length,
      navElementsCount: navElements.length,
      allTestIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'))
    };
  });
  
  console.log('🔍 Component check:', componentCheck);
  
  // Check for user menu again
  const userMenuExists = await page.locator('[data-testid="user-menu"]').count();
  console.log('🔍 User menu elements found:', userMenuExists);
  
  // Check auth state one more time
  const finalAuthState = await page.evaluate(() => {
    return {
      token: localStorage.getItem('finance_manager_token'),
      user: localStorage.getItem('finance_manager_user')
    };
  });
  console.log('🔍 Final auth state:', finalAuthState);
  
  expect(true).toBe(true);
});