import { test, expect } from '@playwright/test';
import { setupGlobalApiMocks } from './helpers/api-mocks';

test('debug homepage after login', async ({ page }) => {
  // Set up API mocks
  await setupGlobalApiMocks(page);
  
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
  await page.waitForTimeout(3000); // Extra wait for React hydration
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
  
  // Check what's on the page
  console.log('🔍 Page URL:', page.url());
  console.log('🔍 Page title:', await page.title());
  
  // Check for any elements with test IDs
  const allTestIds = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'));
  });
  console.log('🔍 All elements with data-testid:', allTestIds);
  
  // Check specifically for navigation elements
  const navExists = await page.locator('nav').isVisible();
  console.log('🔍 Navigation visible:', navExists);
  
  // Check for user menu specifically
  const userMenuExists = await page.locator('[data-testid="user-menu"]').count();
  console.log('🔍 User menu elements found:', userMenuExists);
  
  // Check entire page content
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('🔍 Body contains "user-menu":', bodyHTML.includes('user-menu'));
  console.log('🔍 Body contains "Finance Manager":', bodyHTML.includes('Finance Manager'));
  
  // Check auth state
  const authState = await page.evaluate(() => {
    return {
      token: localStorage.getItem('finance_manager_token'),
      user: localStorage.getItem('finance_manager_user')
    };
  });
  console.log('🔍 Auth state:', authState);
  
  // Force the test to pass so we can see the debug output
  expect(true).toBe(true);
}); 