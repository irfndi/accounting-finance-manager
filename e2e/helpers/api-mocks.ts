/**
 * E2E API Mocking Helper
 * 
 * Provides utilities for mocking API endpoints in Playwright tests
 */

import type { Page, Route } from '@playwright/test';

export interface MockAccount {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  normalBalance: 'debit' | 'credit';
  description?: string;
  isActive: boolean;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: '1',
    code: '1000',
    name: 'Cash and Cash Equivalents',
    type: 'ASSET',
    normalBalance: 'debit',
    description: 'Primary cash account',
    isActive: true,
    balance: 25000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    code: '1100',
    name: 'Accounts Receivable',
    type: 'ASSET',
    normalBalance: 'debit',
    description: 'Customer receivables',
    isActive: true,
    balance: 15000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    code: '2000',
    name: 'Accounts Payable',
    type: 'LIABILITY',
    normalBalance: 'credit',
    description: 'Vendor payables',
    isActive: true,
    balance: 8000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    code: '3000',
    name: 'Owner Equity',
    type: 'EQUITY',
    normalBalance: 'credit',
    description: 'Owner investment in business',
    isActive: true,
    balance: 12000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    code: '4000',
    name: 'Sales Revenue',
    type: 'REVENUE',
    normalBalance: 'credit',
    description: 'Revenue from sales',
    isActive: true,
    balance: 8000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    code: '5000',
    name: 'Office Expenses',
    type: 'EXPENSE',
    normalBalance: 'debit',
    description: 'General office expenses',
    isActive: true,
    balance: 2000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
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

  constructor(private page: Page) {}

  /**
   * Setup all API mocks
   */
  async setupAllMocks(): Promise<void> {
    await this.setupAccountsMocks();
    await this.setupAuthMocks();
  }

  /**
   * Setup accounts API mocks
   */
  async setupAccountsMocks(): Promise<void> {
    // GET /api/accounts - List all accounts
    await this.page.route('**/api/accounts', async (route: Route) => {
      if (route.request().method() === 'GET') {
        const url = new URL(route.request().url());
        const search = url.searchParams.get('search');
        const type = url.searchParams.get('type');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');

        let filteredAccounts = [...this.accounts];

        // Apply search filter
        if (search) {
          filteredAccounts = filteredAccounts.filter(account => 
            account.name.toLowerCase().includes(search.toLowerCase()) ||
            account.code.includes(search)
          );
        }

        // Apply type filter
        if (type && type !== 'ALL') {
          filteredAccounts = filteredAccounts.filter(account => account.type === type);
        }

        // Convert mock accounts to the format expected by ChartOfAccounts component
        const formattedAccounts = filteredAccounts.map(account => ({
          id: parseInt(account.id),
          code: account.code,
          name: account.name,
          type: account.type,
          subtype: 'Current Asset',
          category: 'Cash',
          description: account.description,
          parentId: null,
          level: 1,
          path: account.code,
          isActive: account.isActive,
          isSystem: false,
          allowTransactions: true,
          normalBalance: account.normalBalance,
          currentBalance: account.balance,
          reportCategory: account.type === 'ASSET' ? 'Current Assets' : account.type === 'LIABILITY' ? 'Current Liabilities' : 'Other',
          reportOrder: parseInt(account.id),
          formattedBalance: `$${account.balance.toLocaleString()}.00`,
          accountingInfo: {
            canHaveChildren: true,
            expectedNormalBalance: account.normalBalance,
            isBalanceSheet: ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type),
            isIncomeStatement: ['REVENUE', 'EXPENSE'].includes(account.type)
          },
          children: []
        }));

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedAccounts = formattedAccounts.slice(startIndex, endIndex);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accounts: paginatedAccounts,
            total: formattedAccounts.length,
            page,
            limit,
            totalPages: Math.ceil(formattedAccounts.length / limit),
          }),
        });
      } else if (route.request().method() === 'POST') {
        // POST /api/accounts - Create new account
        const requestData = route.request().postDataJSON();
        
        // Validate required fields
        if (!requestData.code || !requestData.name) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: !requestData.code ? 'Account code is required' : 'Account name is required',
            }),
          });
          return;
        }

        // Check for duplicate code
        if (this.accounts.some(account => account.code === requestData.code)) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Account code already exists',
            }),
          });
          return;
        }

        // Create new account
        const newAccount: MockAccount = {
          id: this.nextAccountId.toString(),
          code: requestData.code,
          name: requestData.name,
          type: requestData.type || 'ASSET',
          normalBalance: requestData.normalBalance || 'debit',
          description: requestData.description || '',
          isActive: true,
          balance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.accounts.push(newAccount);
        this.nextAccountId++;

        // Format the response for the component
        const formattedAccount = {
          id: parseInt(newAccount.id),
          code: newAccount.code,
          name: newAccount.name,
          type: newAccount.type,
          subtype: requestData.subtype || 'Current Asset',
          category: requestData.category || 'Cash',
          description: newAccount.description,
          parentId: requestData.parentId || null,
          level: 1,
          path: newAccount.code,
          isActive: newAccount.isActive,
          isSystem: false,
          allowTransactions: requestData.allowTransactions !== false,
          normalBalance: newAccount.normalBalance,
          currentBalance: 0,
          reportCategory: newAccount.type === 'ASSET' ? 'Current Assets' : newAccount.type === 'LIABILITY' ? 'Current Liabilities' : 'Other',
          reportOrder: requestData.reportOrder || parseInt(newAccount.id),
          formattedBalance: '$0.00',
          accountingInfo: {
            canHaveChildren: true,
            expectedNormalBalance: newAccount.normalBalance,
            isBalanceSheet: ['ASSET', 'LIABILITY', 'EQUITY'].includes(newAccount.type),
            isIncomeStatement: ['REVENUE', 'EXPENSE'].includes(newAccount.type)
          },
          children: []
        };

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(formattedAccount),
        });
      } else {
        await route.continue();
      }
    });

    // GET /api/accounts/:id - Get specific account
    await this.page.route('**/api/accounts/*', async (route: Route) => {
      if (route.request().method() === 'GET') {
        const accountId = route.request().url().split('/').pop();
        const account = this.accounts.find(acc => acc.id === accountId);

        if (!account) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Account not found' }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(account),
        });
      } else {
        await route.continue();
      }
    });

    // GET /api/accounts/stats - Get account statistics
    await this.page.route('**/api/accounts/stats', async (route: Route) => {
      if (route.request().method() === 'GET') {
        const stats = {
          totalAccounts: this.accounts.length,
          activeAccounts: this.accounts.filter(a => a.isActive).length,
          assetAccounts: this.accounts.filter(a => a.type === 'ASSET').length,
          liabilityAccounts: this.accounts.filter(a => a.type === 'LIABILITY').length,
          equityAccounts: this.accounts.filter(a => a.type === 'EQUITY').length,
          revenueAccounts: this.accounts.filter(a => a.type === 'REVENUE').length,
          expenseAccounts: this.accounts.filter(a => a.type === 'EXPENSE').length
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(stats),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Setup authentication API mocks
   */
  async setupAuthMocks(): Promise<void> {
    // POST /api/auth/login
    await this.page.route('**/api/auth/login', async (route: Route) => {
      if (route.request().method() === 'POST') {
        const requestBody = route.request().postDataJSON();
        
        // Check for invalid credentials test case
        if (requestBody.email === 'invalid@example.com' || requestBody.password === 'wrongpassword') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid email or password' })
          });
        }
        // Simple validation for other cases
        else if (requestBody.email && requestBody.password) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: '1',
                email: requestBody.email,
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: new Date().toISOString()
              },
              token: 'mock-jwt-token'
            })
          });
        } else {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid credentials' })
          });
        }
      } else {
        await route.continue();
      }
    });
    
    // POST /api/auth/register
    await this.page.route('**/api/auth/register', async (route: Route) => {
      if (route.request().method() === 'POST') {
        const requestBody = route.request().postDataJSON();
        
        // Basic validation
        if (!requestBody.email || !requestBody.password || !requestBody.firstName || !requestBody.lastName) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ 
              error: 'Validation failed',
              issues: [
                { field: !requestBody.email ? 'email' : !requestBody.password ? 'password' : 
                         !requestBody.firstName ? 'firstName' : 'lastName', 
                  message: 'Field is required' }
              ]
            })
          });
          return;
        }
        
        // Password validation
        if (requestBody.password.length < 8) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ 
              error: 'Validation failed',
              issues: [{ field: 'password', message: 'Password must be at least 8 characters' }]
            })
          });
          return;
        }
        
        // Email format validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestBody.email)) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ 
              error: 'Validation failed',
              issues: [{ field: 'email', message: 'Invalid email format' }]
            })
          });
          return;
        }
        
        // Success case
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: '2',
              email: requestBody.email,
              firstName: requestBody.firstName,
              lastName: requestBody.lastName,
              role: 'user',
              createdAt: new Date().toISOString()
            },
            token: 'mock-jwt-token'
          })
        });
      } else {
        await route.continue();
      }
    });

    // GET /api/auth/profile
    await this.page.route('**/api/auth/profile', async (route: Route) => {
      if (route.request().method() === 'GET') {
        const authHeader = route.request().headers()['authorization'];
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: '1',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: 'user',
              createdAt: new Date().toISOString()
            })
          });
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Unauthorized' })
          });
        }
      } else {
        await route.continue();
      }
    });

    // POST /api/auth/logout
    await this.page.route('**/api/auth/logout', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Logged out successfully' })
        });
      } else {
        await route.continue();
      }
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
      updatedAt: new Date().toISOString(),
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
    this.nextAccountId = 7;
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
 * Global API mock setup for tests
 */
export async function setupGlobalApiMocks(page: Page): Promise<E2EApiMocker> {
  const apiMocker = new E2EApiMocker(page);
  await apiMocker.setupAllMocks();
  return apiMocker;
}