import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupGlobalApiMocks } from './helpers/api-mocks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Set up API mocks and clear auth state for setup
  await setupGlobalApiMocks(page, false);
  
  console.log('🔐 Starting authentication setup...');
  
  // Add retry logic for server readiness
  let retries = 3;
  while (retries > 0) {
    try {
      // Navigate to login page - webServer ensures server is ready
      await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('❌ Failed to navigate to login page after retries:', error);
        throw error;
      }
      console.log(`⚠️ Navigation failed, retrying... (${retries} attempts left)`);
      await page.waitForTimeout(2000);
    }
  }
  
  // Wait for React to hydrate and form to be ready
  await page.waitForFunction(() => {
    const form = document.querySelector('[data-testid="login-form"]');
    const emailInput = document.querySelector('[data-testid="email-input"]');
    const passwordInput = document.querySelector('[data-testid="password-input"]');
    return form !== null && emailInput !== null && passwordInput !== null;
  }, { timeout: 15000 });
  
  // Additional wait for React hydration
  await page.waitForTimeout(2000);
  
  // Fill login form with multiple approaches for reliability
  console.log('📝 Filling email field...');
  const emailInput = page.getByTestId('email-input');
  await emailInput.waitFor({ state: 'visible' });
  
  // Clear field first, then use multiple fill approaches
  await emailInput.clear();
  await emailInput.fill('test@example.com');
  
  // Trigger React events manually
  await emailInput.dispatchEvent('input');
  await emailInput.dispatchEvent('change');
  
  console.log('📝 Filling password field...');
  const passwordInput = page.getByTestId('password-input');
  await passwordInput.waitFor({ state: 'visible' });
  
  await passwordInput.clear();
  await passwordInput.fill('password123456');
  
  // Trigger React events manually
  await passwordInput.dispatchEvent('input');
  await passwordInput.dispatchEvent('change');
  
  // Wait for React state to update
  await page.waitForTimeout(1000);
  
  // Verify fields are filled with retry logic
  let emailValue = '';
  let passwordValue = '';
  
  for (let i = 0; i < 3; i++) {
    emailValue = await emailInput.inputValue();
    passwordValue = await passwordInput.inputValue();
    
    if (emailValue && passwordValue) {
      break;
    }
    
    console.log(`📝 Retry ${i + 1}: Email value: "${emailValue}", Password value: "${passwordValue}"`);
    
    // Retry filling if values are empty
    if (!emailValue) {
      await emailInput.clear();
      await emailInput.type('test@example.com');
      await emailInput.dispatchEvent('input');
    }
    
    if (!passwordValue) {
      await passwordInput.clear();
      await passwordInput.type('password123456');
      await passwordInput.dispatchEvent('input');
    }
    
    await page.waitForTimeout(1000);
  }
  
  console.log(`📝 Final values - Email: "${emailValue}", Password: "${passwordValue}"`);
  
  if (!emailValue || !passwordValue) {
    throw new Error(`Form fields not filled properly after retries. Email: "${emailValue}", Password: "${passwordValue}"`);
  }
  
  // Submit form and wait for navigation
  console.log('🚀 Clicking login button...');
  await page.getByTestId('login-button').click();
  
  // Wait for successful login - dashboard should be visible
  await page.waitForURL('/', { timeout: 15000, waitUntil: 'networkidle' });
  
  // Verify we're logged in by checking for dashboard elements
  await expect(page.getByTestId('dashboard-title')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});