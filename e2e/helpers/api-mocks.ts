/**
 * E2E API Mocking Helper
 * 
 * Provides utilities for mocking API endpoints in Playwright tests
 */

import type { Route } from '@playwright/test';

export interface MockAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: '1',
    code: '1000',
    name: 'Cash',
    type: 'ASSET',
    balance: 25000,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    code: '1100',
    name: 'Accounts Receivable',
    type: 'ASSET',
    balance: 15000,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '3',
    code: '2000',
    name: 'Accounts Payable',
    type: 'LIABILITY',
    balance: -8000,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '4',
    code: '3000',
    name: 'Owner Equity',
    type: 'EQUITY',
    balance: 20000,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '5',
    code: '4000',
    name: 'Revenue',
    type: 'REVENUE',
    balance: 50000,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '6',
    code: '5000',
    name: 'Operating Expenses',
    type: 'EXPENSE',
    balance: 12000,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

export const MOCK_ACCOUNT_STATS = {
  totalAccounts: 6,
  activeAccounts: 6,
  assetAccounts: 2,
  liabilityAccounts: 1,
  equityAccounts: 1,
  revenueAccounts: 1,
  expenseAccounts: 1
};

export class E2EApiMocker {
  private accounts: MockAccount[] = [...MOCK_ACCOUNTS];
  private nextAccountId = 7;
  private page: any; // Changed from Page to any to avoid circular dependency

  constructor(page: any) { // Changed from Page to any
    this.page = page;
  }

  /**
   * Setup all API mocks
   */
  async setupAllMocks(): Promise<void> {
    // Set up accounts mocks
    await this.setupAccountsMocks();
    
    // Set up other API mocks
    await this.setupOtherMocks();
  }

  /**
   * Setup accounts API mocks
   */
  async setupAccountsMocks(): Promise<void> {
    // Mock GET /api/accounts
    await this.page.route('**/api/accounts', async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
          body: JSON.stringify({
            success: true,
            accounts: this.accounts
          })
        });
        return;
      }
    });

    // Mock POST /api/accounts
    await this.page.route('**/api/accounts', async (route: Route) => {
      if (route.request().method() === 'POST') {
        try {
          const requestBody = route.request().postData();
          if (requestBody) {
            const accountData = JSON.parse(requestBody);
            
            const newAccount: MockAccount = {
              id: this.nextAccountId.toString(),
              ...accountData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isActive: true
            };
            this.accounts.push(newAccount);
            this.nextAccountId++;


            await route.fulfill({
              status: 201,
              contentType: 'application/json',
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              },
              body: JSON.stringify({
                success: true,
                account: newAccount
              })
            });
            return;
          }
        } catch (_e) {
          // Log error for test diagnostics
          // eslint-disable-next-line no-console
          console.error(_e);
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Mock error' })
          });
        }
      }
    });
  }

  /**
   * Setup authentication API mocks (deprecated - use setupGlobalApiMocks instead)
   */
  async setupAuthMocks(): Promise<void> {
    // This method is now deprecated in favor of setupGlobalApiMocks
    // which provides a more reliable and consistent mocking approach
  }

  async setupOtherMocks(): Promise<void> {

    // Mock AI insights endpoint
    await this.page.route('**/api/ai-insights', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            result: {
              insights: [
                {
                  type: 'opportunity',
                  title: 'Revenue Growth Opportunity',
                  description: 'AI analysis suggests potential for 15% revenue growth',
                  confidence: 0.85,
                  priority: 'medium'
                }
              ]
            }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock transactions endpoint
    await this.page.route('**/api/transactions', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: []
        })
      });
    });
  }

  /**
   * Add a mock account
   */
  addMockAccount(account: Omit<MockAccount, 'id' | 'createdAt' | 'updatedAt'>): MockAccount {
    const newAccount: MockAccount = {
      ...account,
      id: this.nextAccountId.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.accounts.push(newAccount);
    this.nextAccountId++;
    
    return newAccount;
  }

  /**
   * Clear all mock accounts
   */
  clearMockAccounts(): void {
    this.accounts = [];
    this.nextAccountId = 1;
  }

  /**
   * Reset mock accounts to default
   */
  resetMockAccounts(): void {
    this.accounts = [...MOCK_ACCOUNTS];
    this.nextAccountId = MOCK_ACCOUNTS.length + 1;
  }

  /**
   * Get current mock accounts
   */
  getMockAccounts(): MockAccount[] {
    return [...this.accounts];
  }

  /**
   * Setup error scenarios for testing
   */
  async setupErrorScenarios(): Promise<void> {
    // Network error scenario
    await this.page.route('**/api/accounts/network-error', async (route: Route) => {
      await route.abort('failed');
    });

    // Server error scenario
    await this.page.route('**/api/accounts/server-error', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Timeout scenario
    await this.page.route('**/api/accounts/timeout', async (route: Route) => {
      // Delay for longer than typical timeout
      await new Promise(resolve => setTimeout(resolve, 35000));
      await route.continue();
    });

    // Malformed JSON scenario
    await this.page.route('**/api/accounts/malformed', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response',
      });
    });
  }
}

/**
 * Simplified and reliable API mock setup for tests
 * Uses only page.route() to avoid conflicts between different mocking approaches
 */
export async function setupGlobalApiMocks(page: any, preserveAuth: boolean = true): Promise<E2EApiMocker> { // Changed from Page to any
  const apiMocker = new E2EApiMocker(page);
  // For logout or direct auth tests, set auth tokens on the current page after login scripts run
  if (preserveAuth) {
    try {
      await page.evaluate(() => {
        try {
          localStorage.setItem('finance_manager_token', 'mock-jwt-token-' + Date.now());
          localStorage.setItem('finance_manager_user', JSON.stringify({
            id: 'test-user-id',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
            createdAt: new Date().toISOString()
          }));
        } catch (e) {
          // Log error for test diagnostics
          // eslint-disable-next-line no-console
          console.error(e);
          // SecurityError: localStorage is not accessible in this context
          // Ignore in headless/CI or sandboxed environments
        }
      });
    } catch (e) {
      // Log error for test diagnostics
      // eslint-disable-next-line no-console
      console.error(e);
      // SecurityError: page.evaluate itself failed, skip setting localStorage
    }
  }
  // Use only page.route() for consistent mocking
  await page.route('**/api/**', async (route: Route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    
    // Handle authentication endpoints
    if (url.includes('/api/auth/login') && method === 'POST') {
      const postData = request.postData();
      const body = postData ? JSON.parse(postData) : {};
      const { email, password } = body;
      
      // Valid credentials
      if ((email === 'test@example.com' && password === 'password123456') ||
          (email?.match(/^test\d+@example\.com$/) && password === 'TestPassword123!')) {
        
        const mockResponse = {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: 'test-user-id',
            email: email,
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
            createdAt: new Date().toISOString()
          }
        };
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse)
        });
        return;
      }
      
      // Invalid credentials
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password' })
      });
      return;
    }
    
    // Handle profile endpoint
    if (url.includes('/api/auth/profile') && method === 'GET') {
      const authHeader = request.headers().authorization;
      
      // Accept any Bearer token that starts with 'mock-jwt-token'
      if (authHeader && authHeader.includes('Bearer') && authHeader.includes('mock-jwt-token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-user-id',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
            createdAt: new Date().toISOString()
          })
        });
        return;
      }
      
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
      return;
    }
    
    // Handle register endpoint
    if (url.includes('/api/auth/register') && method === 'POST') {
      const postData = request.postData();
      const body = postData ? JSON.parse(postData) : {};
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: 'test-user-id',
            email: body.email || 'test@example.com',
            firstName: body.firstName || 'Test',
            lastName: body.lastName || 'User',
            role: 'user',
            createdAt: new Date().toISOString()
          }
        })
      });
      return;
    }
    
    // Handle logout endpoint
    if (url.includes('/api/auth/logout') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
      return;
    }
    
    // Handle accounts endpoints
    if (url.includes('/api/accounts') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accounts: [
            {
              id: '1',
              code: '1000',
              name: 'Cash',
              type: 'ASSET',
              balance: 25000,
              isActive: true,
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z'
            },
            {
              id: '2',
              code: '1100',
              name: 'Accounts Receivable',
              type: 'ASSET',
              balance: 15000,
              isActive: true,
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z'
            }
          ]
        })
      });
      return;
    }
    
    if (url.includes('/api/accounts') && method === 'POST') {
      const postData = request.postData();
      const accountData = postData ? JSON.parse(postData) : {};
      
      // Simulate validation errors
      if (accountData.code === '1003' && accountData.name === 'Duplicate Account') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Account code already exists'
          })
        });
        return;
      }
      
      if (accountData.name && accountData.name.length > 100) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Account name is too long (maximum 100 characters)'
          })
        });
        return;
      }
      
      // Success case
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          account: {
            id: '7',
            ...accountData,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });
      return;
    }
    
    // Handle AI insights endpoint
    if (url.includes('/api/ai-insights') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          result: {
            insights: [
              {
                type: 'opportunity',
                title: 'Revenue Growth Opportunity',
                description: 'AI analysis suggests potential for 15% revenue growth',
                confidence: 0.85,
                priority: 'medium'
              },
              {
                type: 'warning',
                title: 'Expense Trend Alert',
                description: 'Operating expenses have increased by 8% this quarter',
                confidence: 0.92,
                priority: 'high'
              }
            ]
          }
        })
      });
      return;
    }

    // Handle account deletion endpoint
    if (url.includes('/api/accounts/') && method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
      return;
    }

    // Handle account export endpoint
    if (url.includes('/api/accounts/export') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              code: '1000',
              name: 'Cash',
              type: 'ASSET',
              balance: 25000
            }
          ]
        })
      });
      return;
    }

    // Handle financial reports endpoints
    if (url.includes('/api/reports/balance-sheet') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          assets: {
            currentAssets: [
              { id: '1', name: 'Cash', amount: 25000, formattedAmount: '$25,000.00' },
              { id: '2', name: 'Accounts Receivable', amount: 15000, formattedAmount: '$15,000.00' }
            ],
            nonCurrentAssets: []
          },
          liabilities: {
            currentLiabilities: [
              { id: '3', name: 'Accounts Payable', amount: 8000, formattedAmount: '$8,000.00' }
            ],
            nonCurrentLiabilities: []
          },
          equity: [
            { id: '4', name: 'Owner Equity', amount: 32000, formattedAmount: '$32,000.00' }
          ]
        })
      });
      return;
    }

    if (url.includes('/api/reports/income-statement') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          revenue: [
            { id: '5', name: 'Sales Revenue', amount: 50000, formattedAmount: '$50,000.00' }
          ],
          expenses: [
            { id: '6', name: 'Operating Expenses', amount: 12000, formattedAmount: '$12,000.00' }
          ],
          netIncome: 38000
        })
      });
      return;
    }

    if (url.includes('/api/reports/cash-flow') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          operatingActivities: [
            { id: '1', name: 'Net Income', amount: 38000, formattedAmount: '$38,000.00' }
          ],
          investingActivities: [],
          financingActivities: [],
          netCashFlow: 38000
        })
      });
      return;
    }

    // Handle transactions endpoint
    if (url.includes('/api/transactions')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: []
        })
      });
      return;
    }

    // Handle other API endpoints with generic success
    if (url.includes('/api/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
      return;
    }
    
    // Continue with original request for non-API calls
    await route.continue();
  });

  return apiMocker;
}