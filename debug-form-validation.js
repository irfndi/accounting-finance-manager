import { chromium } from 'playwright';

async function debugFormValidation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3001/login');
    
    // Wait for the form to load
    console.log('Waiting for login form...');
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
    
    console.log('Form loaded, taking initial screenshot...');
    await page.screenshot({ path: 'debug-initial.png', fullPage: true });
    
    // Get initial form HTML
    const initialHTML = await page.locator('[data-testid="login-form"]').innerHTML();
    console.log('Initial form HTML:', initialHTML.substring(0, 500) + '...');
    
    // Click submit button without filling fields
    console.log('Clicking submit button...');
    await page.click('[data-testid="login-button"]');
    
    // Wait a moment for validation
    await page.waitForTimeout(2000);
    
    console.log('Taking post-submit screenshot...');
    await page.screenshot({ path: 'debug-post-submit.png', fullPage: true });
    
    // Get form HTML after submit
    const postSubmitHTML = await page.locator('[data-testid="login-form"]').innerHTML();
    console.log('Post-submit form HTML:', postSubmitHTML.substring(0, 500) + '...');
    
    // Check for error messages
    const emailError = await page.locator('text=Email is required').count();
    const passwordError = await page.locator('text=Password is required').count();
    
    console.log('Email error count:', emailError);
    console.log('Password error count:', passwordError);
    
    // Check for any error elements
    const errorElements = await page.locator('.text-red-500').count();
    console.log('Total error elements with .text-red-500:', errorElements);
    
    // Get all text content to see what's actually on the page
    const pageText = await page.textContent('body');
    console.log('Page contains "Email is required":', pageText.includes('Email is required'));
    console.log('Page contains "Password is required":', pageText.includes('Password is required'));
    
    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    console.log('Debug complete. Check debug-initial.png and debug-post-submit.png');
    
  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugFormValidation();