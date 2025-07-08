/**
 * E2E Authentication Helper
 * 
 * Provides utilities for handling authentication in Playwright tests
 */

import type { Page, BrowserContext } from '@playwright/test';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
}

export const TEST_USERS = {
  admin: {
    id: 'test-admin-id',
    email: 'admin@test.com',
    password: 'AdminTest123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const,
  },
  user: {
    id: 'test-user-id',
    email: 'user@test.com',
    password: 'UserTest123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user' as const,
  },
} as const;

export class E2EAuthHelper {
  constructor(private page: Page) {}

  /**
   * Login a user via the UI
   */
  async loginViaUI(email: string, password: string): Promise<void> {
    // Set up console logging
    this.page.on('console', msg => {
      console.log(`PAGE LOG [${msg.type()}]: ${msg.text()}`);
    });
    
    this.page.on('pageerror', error => {
      console.error('PAGE ERROR:', error.message);
    });
    
    // Navigate to the login page
    await this.page.goto('/login');

    // Wait for login inputs to appear (after hydration)
    await this.page.waitForSelector('[data-testid="email-input"]', { timeout: 20000 });
    await this.page.waitForSelector('[data-testid="password-input"]', { timeout: 20000 });

    console.log(`E2E: Filling login form with email: ${email}`);
    
    // Fill in credentials
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);

    console.log('E2E: Clicking login button');
    
    // Click login button
    await this.page.click('[data-testid="login-button"]');
    
    console.log('E2E: Waiting for login response...');
    
    // Wait a bit for the login process to complete
    await this.page.waitForTimeout(2000);
    
    // Wait for navigation to complete - either to dashboard or stay on login with error
    try {
      console.log('E2E: Checking for user menu or error message...');
      
      // Wait for either success (user menu appears) or error (error message appears)
      await Promise.race([
        this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 }),
        this.page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 })
      ]);
      
      // Check if we're on the dashboard (user menu should be visible)
      const userMenu = await this.page.locator('[data-testid="user-menu"]').isVisible();
      console.log(`E2E: User menu visible: ${userMenu}`);
      
      if (!userMenu) {
        throw new Error('Login failed - user menu not found after login attempt');
      }
      
      console.log('E2E: Login successful!');
    } catch (error) {
      // If waiting fails, check current URL and page state
      const currentUrl = this.page.url();
      console.error(`Login failed. Current URL: ${currentUrl}`);
      
      // Try to get any error messages on the page
      try {
        const errorElement = await this.page.locator('[data-testid="error-message"]').textContent();
        if (errorElement) {
          console.error(`Login error message: ${errorElement}`);
        }
      } catch {
        // Ignore if no error message found
      }
      
      // Check localStorage state
      const authState = await this.page.evaluate(() => {
        return {
          token: localStorage.getItem('finance_manager_token'),
          user: localStorage.getItem('finance_manager_user')
        };
      });
      console.error('Auth state in localStorage:', authState);
      
      throw new Error(`Login via UI failed: ${error}`);
    }
  }

  /**
   * Login a user via API and set the token in localStorage
   */
  async loginViaAPI(user: TestUser): Promise<string> {
    // Mock the API response since we don't have a real database in E2E tests
    const mockToken = `mock-jwt-token-${Date.now()}`;
    
    // Set the token in localStorage
    await this.page.addInitScript((token: string, userData: any) => {
      localStorage.setItem('finance_manager_token', token);
      localStorage.setItem('finance_manager_user', JSON.stringify(userData));
    }, mockToken, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });

    return mockToken;
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    // Try to logout via UI first
    try {
      await this.page.click('[data-testid="user-menu"]');
      await this.page.click('[data-testid="logout-button"]');
      await this.page.waitForURL('/login', { timeout: 5000 });
    } catch {
      // If UI logout fails, clear localStorage and navigate to login
      await this.page.evaluate(() => {
        localStorage.removeItem('finance_manager_token');
        localStorage.removeItem('finance_manager_user');
      });
      await this.page.goto('/login');
    }
  }

  /**
   * Check if user is currently logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.page.evaluate(() => localStorage.getItem('finance_manager_token'));
      return !!token;
    } catch {
      return false;
    }
  }

  /**
   * Get current auth token from localStorage
   */
  async getAuthToken(): Promise<string | null> {
    try {
      return await this.page.evaluate(() => localStorage.getItem('finance_manager_token'));
    } catch {
      return null;
    }
  }

  /**
   * Set auth token directly in localStorage
   */
  async setAuthToken(token: string): Promise<void> {
    await this.page.addInitScript((token) => {
      localStorage.setItem('finance_manager_token', token);
    }, token);
  }

  /**
   * Create a test user via API
   */
  async createTestUser(userData?: Partial<TestUser>): Promise<TestUser> {
    // Mock user creation since we don't have a real database in E2E tests
    const timestamp = Date.now();
    const testUser: TestUser = {
      id: `test-user-${timestamp}`,
      email: userData?.email || `test${timestamp}@example.com`,
      password: userData?.password || 'TestPassword123!',
      firstName: userData?.firstName || 'Test',
      lastName: userData?.lastName || 'User',
      role: userData?.role || 'user',
    };

    // In E2E tests, we just return the mock user without hitting the API
    return testUser;
  }

  /**
   * Setup authentication state for a context
   */
  static async setupAuthState(context: BrowserContext, user: TestUser): Promise<void> {
    const page = await context.newPage();
    const authHelper = new E2EAuthHelper(page);
    
    try {
      // Create test user if needed
      const testUser = await authHelper.createTestUser({
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
      
      // Login via API to get token
      const token = await authHelper.loginViaAPI(testUser);
      
      // Set auth state in context
      await context.addInitScript((token: string, userData: any) => {
        localStorage.setItem('finance_manager_token', token);
        localStorage.setItem('finance_manager_user', JSON.stringify(userData));
      }, token, {
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
      });
    } finally {
      await page.close();
    }
  }
}

/**
 * Global auth setup for tests
 */
export async function setupGlobalAuth(page: Page): Promise<void> {
  const authHelper = new E2EAuthHelper(page);
  
  // Create test users
  const _adminUser = await authHelper.createTestUser({
    email: TEST_USERS.admin.email,
    password: TEST_USERS.admin.password,
    firstName: TEST_USERS.admin.firstName,
    lastName: TEST_USERS.admin.lastName,
    role: 'admin'
  });
  
  const regularUser = await authHelper.createTestUser({
    email: TEST_USERS.user.email,
    password: TEST_USERS.user.password,
    firstName: TEST_USERS.user.firstName,
    lastName: TEST_USERS.user.lastName,
    role: 'user'
  });
  
  // Login default user
  await authHelper.loginViaAPI(regularUser);
}

/**
 * Cleanup auth state
 */
export async function cleanupAuth(page: Page): Promise<void> {
  try {
    // Ensure page is ready and accessible
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    
    // Clear localStorage safely
    await page.evaluate(() => {
      try {
        localStorage.removeItem('finance_manager_token');
        localStorage.removeItem('finance_manager_user');
      } catch (error) {
        // Ignore localStorage access errors
        console.warn('Could not clear localStorage:', error);
      }
    });
  } catch (error) {
    // Ignore cleanup errors - they shouldn't fail tests
    console.warn('Auth cleanup failed:', error);
  }
}