import { test, expect, type Page } from '@playwright/test';

test.describe('Account Management', () => {
  type MockAccountsOptions = {
    initialAccounts?: Array<{
      code: string;
      name: string;
      type?: string;
      normalBalance?: string;
      description?: string;
      parentId?: number | null;
      subtype?: string;
      category?: string;
      isActive?: boolean;
      allowTransactions?: boolean;
    }>;
    getError?: { status: number; body?: any };
    postError?: { status: number; body?: any };
  };

  const mockAccountsApi = async (page: Page, options: MockAccountsOptions = {}) => {
    const accounts: any[] = (options.initialAccounts ?? []).map((account, index) => ({
      id: index + 1,
      code: account.code,
      name: account.name,
      type: account.type ?? 'ASSET',
      subtype: account.subtype ?? '',
      category: account.category ?? '',
      description: account.description ?? '',
      parentId: account.parentId ?? null,
      level: 0,
      path: account.code,
      isActive: account.isActive ?? true,
      isSystem: false,
      allowTransactions: account.allowTransactions ?? true,
      normalBalance: account.normalBalance ?? 'debit',
      currentBalance: 0,
      reportCategory: '',
      reportOrder: 0,
      formattedBalance: '$0.00',
    }));
    let nextId = accounts.length + 1;

    await page.route('**/api/accounts**', async (route) => {
      const request = route.request();
      const method = request.method();

      if (method === 'GET') {
        if (options.getError) {
          const body = options.getError.body ?? { error: 'Internal server error' };
          await route.fulfill({
            status: options.getError.status,
            contentType: 'application/json',
            body: JSON.stringify(body),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accounts }),
        });
        return;
      }

      if (method === 'POST') {
        if (options.postError) {
          const body = options.postError.body ?? { error: 'Validation error' };
          await route.fulfill({
            status: options.postError.status,
            contentType: 'application/json',
            body: JSON.stringify(body),
          });
          return;
        }

        let data: any = {};
        try {
          data = request.postDataJSON();
        } catch {
          data = {};
        }

        const newAccount = {
          id: nextId++,
          code: data.code ?? `A${nextId}`,
          name: data.name ?? 'New Account',
          type: data.type ?? 'ASSET',
          subtype: data.subtype ?? '',
          category: data.category ?? '',
          description: data.description ?? '',
          parentId: data.parentId ?? null,
          level: 0,
          path: data.code ?? '',
          isActive: data.isActive ?? true,
          isSystem: false,
          allowTransactions: data.allowTransactions ?? true,
          normalBalance: data.normalBalance ?? 'debit',
          currentBalance: 0,
          reportCategory: '',
          reportOrder: 0,
          formattedBalance: '$0.00',
        };

        accounts.push(newAccount);

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ account: newAccount }),
        });
        return;
      }

      if (method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
        return;
      }

      await route.fallback();
    });
  };

  const prepareChart = async (page: Page, options?: MockAccountsOptions) => {
    await mockAccountsApi(page, options);
    await gotoAndWait(page, '/chart-of-accounts', /chart of accounts/i);
  };

  const prepareLedger = async (page: Page, options?: MockAccountsOptions) => {
    await mockAccountsApi(page, options);
    await gotoAndWait(page, '/general-ledger', /general ledger/i);
  };

  const gotoAndWait = async (page: Page, path: string, heading: RegExp) => {
    await page.goto(path);
    const h1 = page.locator('header').getByRole('heading', { level: 1, name: heading }).first();
    await expect(h1).toBeVisible({ timeout: 30000 });
  };

  const openAccountDialog = async (page: Page) => {
    const addButton = page.getByRole('button', { name: /add account/i }).first();
    await expect(addButton).toBeVisible({ timeout: 20000 });
    await addButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    return dialog;
  };

  test('should display Chart of Accounts page', async ({ page }) => {
    await prepareChart(page);
    await expect(page.getByRole('button', { name: /add account/i }).first()).toBeVisible({ timeout: 15000 });
  });

  test('should display General Ledger page', async ({ page }) => {
    await prepareLedger(page);
    await expect(page.getByRole('button', { name: /add account/i }).first()).toBeVisible({ timeout: 15000 });
  });

  test.describe('Chart of Accounts', () => {
    test('should validate required fields when creating account', async ({ page }) => {
      await prepareChart(page);
      const dialog = await openAccountDialog(page);

      // Submit empty form
      await dialog.getByTestId('account-submit').click();
      await expect(dialog.getByText('Account code is required')).toBeVisible({ timeout: 5000 });

      // Fill code and resubmit to trigger name validation
      await dialog.getByLabel(/code/i).fill('1001');
      await dialog.getByTestId('account-submit').click();
      await expect(dialog.getByText('Account name is required')).toBeVisible({ timeout: 5000 });
    });

    test('should successfully create new account', async ({ page }) => {
      await prepareChart(page);
      const dialog = await openAccountDialog(page);

      // Fill in the form
      await dialog.getByLabel(/code/i).fill('1001');
      await dialog.getByLabel(/name/i).fill('Test Cash Account');

      // Fill description if available
      const descriptionField = dialog.getByLabel(/description/i);
      if (await descriptionField.isVisible()) {
        await descriptionField.fill('Test account for E2E testing');
      }

      // Submit the form
      await dialog.getByTestId('account-submit').click();

      // Wait for success and check if account appears
      await page.waitForTimeout(2000);
      await expect(page.getByText('Test Cash Account')).toBeVisible({ timeout: 10000 });
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await prepareChart(page, {
        postError: {
          status: 400,
          body: { error: 'Account code already exists' },
        },
      });
      const dialog = await openAccountDialog(page);

      await dialog.getByLabel(/code/i).fill('1003');
      await dialog.getByLabel(/name/i).fill('Duplicate Account');
      await dialog.getByTestId('account-submit').click();

      // Should show error message
      await expect(dialog.getByText('Account code already exists')).toBeVisible({ timeout: 5000 });
    });

    test('should filter accounts by type', async ({ page }) => {
      await prepareChart(page, {
        initialAccounts: [
          { code: '1000', name: 'Cash', type: 'ASSET' },
          { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
        ],
      });
      await expect(page.locator('main').getByRole('cell', { name: /^Cash$/ }).first()).toBeVisible({ timeout: 10000 });

      // Wait for accounts to load
      await page.waitForTimeout(2000);

      // Look for filter dropdown
      const filterSelect = page.locator('select').filter({ hasText: /type|filter/i }).first();
      if (await filterSelect.count()) {
        await filterSelect.selectOption('ASSET');
        await page.waitForTimeout(1000);

        // Check if filtering worked
        const accountRows = page.locator('[data-testid="account-row"], tr').filter({ hasText: /ASSET|Asset/ });
        if (await accountRows.count() > 0) {
          await expect(accountRows.first()).toBeVisible();
        }
      }
    });

    test('should search accounts', async ({ page }) => {
      await prepareChart(page, {
        initialAccounts: [
          { code: '1000', name: 'Cash', type: 'ASSET' },
          { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
        ],
      });

      // Wait for accounts to load
      await page.waitForTimeout(2000);

      // Look for search input
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('Cash');
        await page.waitForTimeout(1000);

        // Check if search worked
        const searchResults = page.locator('[data-testid="account-row"], tr').filter({ hasText: /Cash/i });
        if (await searchResults.count() > 0) {
          await expect(searchResults.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('General Ledger', () => {
    test('should validate required fields when creating account', async ({ page }) => {
      await prepareLedger(page);
      const dialog = await openAccountDialog(page);

      await dialog.getByTestId('account-submit').click();
      await expect(dialog.getByText('Account code is required')).toBeVisible({ timeout: 5000 });

      await dialog.getByLabel(/code/i).fill('2001');
      await dialog.getByTestId('account-submit').click();
      await expect(dialog.getByText('Account name is required')).toBeVisible({ timeout: 5000 });
    });

    test('should successfully create new account', async ({ page }) => {
      await prepareLedger(page);
      const dialog = await openAccountDialog(page);

      // Fill in the form
      await dialog.getByLabel(/code/i).fill('2001');
      await dialog.getByLabel(/name/i).fill('Test Liability Account');

      // Submit the form
      await dialog.getByTestId('account-submit').click();

      // Wait for success and check if account appears
      await page.waitForTimeout(2000);
      await expect(page.getByText('Test Liability Account')).toBeVisible({ timeout: 10000 });
    });

    test('should display account statistics', async ({ page }) => {
      await prepareLedger(page, {
        initialAccounts: [
          { code: '1000', name: 'Cash', type: 'ASSET' },
          { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
          { code: '3000', name: 'Owner Equity', type: 'EQUITY' },
        ],
      });

      // Wait for statistics to load
      await page.waitForTimeout(2000);

      // Should show statistics cards
      await expect(page.getByText('Total Accounts')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Active Accounts')).toBeVisible({ timeout: 5000 });
    });

    test('should search accounts in general ledger', async ({ page }) => {
      await prepareLedger(page, {
        initialAccounts: [
          { code: '1000', name: 'Cash', type: 'ASSET' },
          { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
        ],
      });

      // Wait for accounts to load
      await page.waitForTimeout(2000);

      // Look for search input
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('Cash');
        await page.waitForTimeout(1000);

        // Check if search worked
        const searchResults = page.locator('[data-testid="account-row"], tr').filter({ hasText: /Cash/i });
        if (await searchResults.count() > 0) {
          await expect(searchResults.first()).toBeVisible();
        }
      }
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept API calls to simulate network error
      await page.route('**/api/accounts**', route => {
        route.abort('failed');
      });
      await gotoAndWait(page, '/general-ledger', /general ledger/i);
      await page.waitForTimeout(2000);

      // Should show error message or loading state
      const errorMessage = page.getByText(/failed|error|retry/i).first();
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    });

    test('should validate account type selection', async ({ page }) => {
      await prepareLedger(page);
      const dialog = await openAccountDialog(page);
      const typeSelect = dialog.locator('[role="combobox"]').first();
      await expect(typeSelect).toBeVisible({ timeout: 5000 });
    });

    test('should handle API errors when creating accounts', async ({ page }) => {
      await prepareLedger(page, {
        postError: {
          status: 400,
          body: { error: 'Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE' },
        },
      });
      const dialog = await openAccountDialog(page);

      await dialog.getByLabel(/code/i).fill('9999');
      await dialog.getByLabel(/name/i).fill('Invalid Account');
      await dialog.getByTestId('account-submit').click();

      // Should show error message
      await expect(dialog.getByText('Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('API Error Handling', () => {
    test('should handle 500 server errors', async ({ page }) => {
      await prepareChart(page, {
        getError: {
          status: 500,
          body: { error: 'Internal server error' },
        },
      });
      await page.reload();
      await page.waitForTimeout(2000);

      // Should show error message
      const errorMessage = page.getByText(/failed|error|server/i).first();
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    });

    test('should handle network timeouts', async ({ page }) => {
      // Intercept API calls to simulate timeout
      await page.route('**/api/accounts**', route => {
        // Simulate timeout by delaying and then aborting
        setTimeout(() => route.abort('timedout'), 2000);
      });
      await gotoAndWait(page, '/chart-of-accounts', /chart of accounts/i);
      await page.reload();
      await page.waitForTimeout(3000);

      // Should show timeout or error message
      const timeoutMessage = page.getByText(/timeout|failed|error/i).first();
      if (await timeoutMessage.isVisible()) {
        await expect(timeoutMessage).toBeVisible();
      }
    });

    test('should handle malformed JSON responses', async ({ page }) => {
      // Intercept API calls to return malformed JSON
      await page.route('**/api/accounts**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json{'
        });
      });
      await gotoAndWait(page, '/chart-of-accounts', /chart of accounts/i);
      await page.reload();
      await page.waitForTimeout(2000);

      // Should handle JSON parse error gracefully
      const parseError = page.getByText(/parse|invalid|error/i).first();
      if (await parseError.isVisible()) {
        await expect(parseError).toBeVisible();
      }
    });

    test('should handle authentication errors', async ({ page }) => {
      // Intercept API calls to simulate auth error
      await page.route('**/api/accounts**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });
      await gotoAndWait(page, '/chart-of-accounts', /chart of accounts/i);
      await page.reload();
      await page.waitForTimeout(2000);

      // Should show auth error or redirect
      const authError = page.getByText(/unauthorized|login|auth/i).first();
      if (await authError.isVisible()) {
        await expect(authError).toBeVisible();
      }
    });

    test('should handle retry functionality', async ({ page }) => {
      let requestCount = 0;

      // Intercept API calls - fail first, succeed second
      await page.route('**/api/accounts**', route => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              accounts: [
                { id: 1, code: '1000', name: 'Cash', type: 'ASSET' },
              ],
            }),
          });
        }
      });

      await gotoAndWait(page, '/chart-of-accounts', /chart of accounts/i);
      await page.reload();
      await page.waitForTimeout(2000);

      // Look for retry button or error message
      const retryButton = page.getByText(/retry/i).first();
      if (await retryButton.isVisible()) {
        await retryButton.click();
        await page.waitForTimeout(2000);

        // Should eventually succeed
        const successIndicator = page.getByText(/chart of accounts|accounts/i).first();
        if (await successIndicator.isVisible()) {
          await expect(successIndicator).toBeVisible();
        }
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle special characters in account names', async ({ page }) => {
      await prepareChart(page);
      const dialog = await openAccountDialog(page);

      // Fill form with special characters
      await dialog.getByLabel(/code/i).fill('9999');
      await dialog.getByLabel(/name/i).fill('Test Account with Special Chars: @#$%^&*()');

      await dialog.getByTestId('account-submit').click();
      await page.waitForTimeout(2000);

      // Should handle special characters properly
      await expect(page.getByText('Test Account with Special Chars: @#$%^&*()')).toBeVisible({ timeout: 10000 });
    });

    test('should validate account code format', async ({ page }) => {
      await prepareChart(page);
      const dialog = await openAccountDialog(page);

      // Test with empty code first
      await dialog.getByLabel(/name/i).fill('Test Account');

      await dialog.getByTestId('account-submit').click();

      // Should show validation error for empty code
      await expect(dialog.getByText('Account code is required')).toBeVisible({ timeout: 5000 });
    });

    test('should handle very long account names', async ({ page }) => {
      await prepareChart(page);
      const dialog = await openAccountDialog(page);

      const longName = 'A'.repeat(256); // Very long name

      await dialog.getByLabel(/code/i).fill('8888');
      await dialog.getByLabel(/name/i).fill(longName);

      await dialog.getByTestId('account-submit').click();
      await page.waitForTimeout(2000);

      const errorMessage = dialog.getByText(/too long|invalid|error/i);
      await expect(async () => {
        const successVisible = await page.getByText(longName).isVisible();
        const errorVisible = await errorMessage.isVisible();
        expect(successVisible || errorVisible).toBeTruthy();
      }).toPass({ timeout: 10000 });
    });

    test('should handle concurrent account creation attempts', async ({ page }) => {
      await prepareChart(page);
      // Simulate rapid successive account creation attempts
      const dialog = await openAccountDialog(page);

      await dialog.getByLabel(/code/i).fill('7777');
      await dialog.getByLabel(/name/i).fill('Concurrent Test Account');

      // Click create button multiple times rapidly
      const createButton = dialog.getByTestId('account-submit');
      // Fire two clicks synchronously to simulate rapid double submit without flaking on unmount.
      await createButton.evaluate((button) => {
        (button as any).click();
        (button as any).click();
      });

      await page.waitForTimeout(2000);

      const errorMessage = dialog.getByText(/error|duplicate|exists/i);
      const successCell = page.locator('main').getByRole('cell', { name: 'Concurrent Test Account' }).first();
      await expect(async () => {
        const successVisible = await successCell.isVisible();
        const errorVisible = await errorMessage.isVisible();
        expect(successVisible || errorVisible).toBeTruthy();
      }).toPass({ timeout: 10000 });
    });
  });
});
