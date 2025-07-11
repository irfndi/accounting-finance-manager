import { test, expect } from '@playwright/test';
import { setupGlobalApiMocks } from './helpers/api-mocks';

test('debug auth context and API calls', async ({ page }) => {
  // Set up API mocks
  await setupGlobalApiMocks(page);
  
  // Track API requests
  const apiRequests: string[] = [];
  const apiResponses: { url: string; status: number; body?: any }[] = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiRequests.push(`${request.method()} ${request.url()}`);
      console.log('🌐 API Request:', request.method(), request.url());
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      try {
        const body = await response.text();
        apiResponses.push({ 
          url: response.url(), 
          status: response.status(),
          body: body 
        });
        console.log('📥 API Response:', response.status(), response.url(), body);
      } catch {
        console.log('📥 API Response:', response.status(), response.url(), '(no body)');
      }
    }
  });
  
  // Track console messages about auth
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('auth') || text.includes('Auth') || text.includes('profile') || text.includes('Profile')) {
      console.log('🖥️ Auth Console:', msg.type(), text);
    }
  });
  
  // Add logging to track auth provider state
  await page.addInitScript(() => {
    // Override console.log to track auth provider logging
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function(...args) {
      if (args.some(arg => typeof arg === 'string' && (arg.includes('auth') || arg.includes('Auth')))) {
        originalLog.apply(console, ['[AUTH LOG]', ...args]);
      }
      originalLog.apply(console, args);
    };
    
    console.error = function(...args) {
      if (args.some(arg => typeof arg === 'string' && (arg.includes('auth') || arg.includes('Auth')))) {
        originalError.apply(console, ['[AUTH ERROR]', ...args]);
      }
      originalError.apply(console, args);
    };
    
    console.warn = function(...args) {
      if (args.some(arg => typeof arg === 'string' && (arg.includes('auth') || arg.includes('Auth')))) {
        originalWarn.apply(console, ['[AUTH WARN]', ...args]);
      }
      originalWarn.apply(console, args);
    };
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
  
  // Clear previous API tracking
  apiRequests.length = 0;
  apiResponses.length = 0;
  
  // Click login button
  await page.click('[data-testid="login-button"]');
  
  // Wait for navigation to home
  await page.waitForURL('/', { timeout: 10000 });
  console.log('✅ Successfully navigated to homepage');
  
  console.log('=== HOMEPAGE PHASE ===');
  
  // Wait for page to load completely and let AuthProvider do its thing
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Give extra time for auth refresh
  
  console.log('=== RESULTS ===');
  console.log('🔍 API requests made after login:', apiRequests);
  console.log('🔍 API responses received:', apiResponses.map(r => `${r.status} ${r.url}`));
  
  // Check if auth profile API was called
  const profileApiCalled = apiRequests.some(req => req.includes('/api/auth/profile'));
  console.log('🔍 Profile API called:', profileApiCalled);
  
  // Check current auth state
  const authState = await page.evaluate(() => {
    return {
      token: localStorage.getItem('finance_manager_token'),
      user: localStorage.getItem('finance_manager_user')
    };
  });
  console.log('🔍 Final auth state:', authState);
  
  // Check for user menu again
  const userMenuExists = await page.locator('[data-testid="user-menu"]').count();
  console.log('🔍 User menu elements found:', userMenuExists);
  
  // Check if UserSection is visible 
  const userSectionVisible = await page.evaluate(() => {
    // Look for any text that would be in the UserSection
    return document.body.textContent?.includes('Click to manage account') || false;
  });
  console.log('🔍 UserSection text found:', userSectionVisible);
  
  expect(true).toBe(true);
});