import { test as setup } from '@playwright/test';
import { E2EAuthHelper, cleanupAuth } from './helpers/auth';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Clear any existing auth state
  await cleanupAuth(page);
  
  // Mock API endpoints for setup
  await page.route('**/api/auth/login', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Login successful',
        user: {
          id: 'test-user-id',
          email: postData.email,
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          createdAt: new Date().toISOString()
        },
        token: 'mock-jwt-token'
      })
    });
  });
  
  // Mock profile endpoint for auth verification
  await page.route('**/api/auth/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        createdAt: new Date().toISOString()
      })
    });
  });
  
  const authHelper = new E2EAuthHelper(page);
  const testUser = await authHelper.createTestUser();
  // Set auth token and user data directly in localStorage
  const mockToken = `mock-jwt-token-${Date.now()}`;
  // Navigate to login page first to set storage in correct origin
  await page.goto('/login');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('finance_manager_token', token);
    localStorage.setItem('finance_manager_user', JSON.stringify(userData));
  }, { token: mockToken, userData: testUser });
  // Navigate to home to confirm auth state is applied
  await page.goto('/');
  // Save signed-in state to 'authFile'
  await page.context().storageState({ path: authFile });
});