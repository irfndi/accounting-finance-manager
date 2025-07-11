import { test } from '@playwright/test';
import { setupGlobalApiMocks } from './helpers/api-mocks';

test('debug register page navigation', async ({ page }) => {
  // Set up API mocks
  await setupGlobalApiMocks(page, false);
  
  // Add console logging
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  // Navigate directly to register page
  console.log('Navigating to /register...');
  await page.goto('/register', { waitUntil: 'networkidle' });
  
  console.log('Current URL:', page.url());
  
  // Check if we're on the register page
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for register form
  const registerForm = page.getByTestId('register-form');
  const isFormVisible = await registerForm.isVisible().catch(() => false);
  console.log('Register form visible:', isFormVisible);
  
  // Check for "Create your account" text
  const createAccountText = page.getByText('Create your account');
  const isTextVisible = await createAccountText.isVisible().catch(() => false);
  console.log('"Create your account" text visible:', isTextVisible);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-register-page.png', fullPage: true });
  
  // Wait a bit and check again
  await page.waitForTimeout(2000);
  
  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);
  
  // Check page content
  const pageContent = await page.content();
  console.log('Page contains "Create your account":', pageContent.includes('Create your account'));
  console.log('Page contains "register-form":', pageContent.includes('register-form'));
});