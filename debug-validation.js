// Debug script to test form validation
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to login page
  await page.goto('http://localhost:3001/login');
  
  // Wait for form to load
  await page.waitForSelector('[data-testid="login-form"]');
  
  console.log('Form loaded, clicking submit button...');
  
  // Click submit button without filling fields
  await page.click('[data-testid="login-button"]');
  
  // Wait a bit for validation to trigger
  await page.waitForTimeout(1000);
  
  // Check if validation errors are present
  const emailError = await page.locator('text=Email is required').isVisible();
  const passwordError = await page.locator('text=Password is required').isVisible();
  
  console.log('Email error visible:', emailError);
  console.log('Password error visible:', passwordError);
  
  // Get the HTML content to see what's actually rendered
  const formHTML = await page.locator('[data-testid="login-form"]').innerHTML();
  console.log('Form HTML after submit:', formHTML);
  
  await browser.close();
})();