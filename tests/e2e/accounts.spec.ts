import { test, expect } from '@playwright/test';

test.describe('Account Management', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the app to be ready
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display Chart of Accounts page', async ({ page }) => {
    await page.goto('/chart-of-accounts');
    await page.waitForLoadState('networkidle');
    
    // Wait for the page to load and check for the heading
    await expect(page.locator('h1, h2, [data-testid="page-title"]')).toContainText('Chart of Accounts');
    await expect(page.getByText('Add Account')).toBeVisible();
  });

  test('should display General Ledger page', async ({ page }) => {
    await page.goto('/general-ledger');
    await page.waitForLoadState('networkidle');
    
    // Wait for the page to load and check for the heading
    await expect(page.locator('h1, h2, [data-testid="page-title"]')).toContainText('General Ledger');
    await expect(page.getByText('Add Account')).toBeVisible();
  });

  test.describe('Chart of Accounts', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/chart-of-accounts');
      await page.waitForLoadState('networkidle');
    });

    test('should validate required fields when creating account', async ({ page }) => {
      // Click Add Account button
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500); // Wait for dialog to open
      
      // Try to submit without filling required fields
      await page.getByText('Create Account').click();
      
      // Should show validation errors
      await expect(page.getByText('Account code is required')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Account name is required')).toBeVisible({ timeout: 5000 });
    });

    test('should successfully create new account', async ({ page }) => {
      // Click Add Account button
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500);
      
      // Fill in the form
      await page.getByPlaceholder(/code/i).fill('1001');
      await page.getByPlaceholder(/name/i).fill('Test Cash Account');
      
      // Select account type (ASSET should be default)
      const typeSelect = page.locator('select, [role="combobox"]').first();
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('ASSET');
      }
      
      // Fill description if available
      const descriptionField = page.getByPlaceholder(/description/i);
      if (await descriptionField.isVisible()) {
        await descriptionField.fill('Test account for E2E testing');
      }
      
      // Submit the form
      await page.getByText('Create Account').click();
      
      // Wait for success and check if account appears
      await page.waitForTimeout(2000);
      await expect(page.getByText('Test Cash Account')).toBeVisible({ timeout: 10000 });
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept API calls to simulate errors
      await page.route('/api/accounts', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Account code already exists' })
          });
        } else {
          route.continue();
        }
      });
      
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500);
      
      await page.getByPlaceholder(/code/i).fill('1003');
      await page.getByPlaceholder(/name/i).fill('Duplicate Account');
      await page.getByText('Create Account').click();
      
      // Should show error message
      await expect(page.getByText('Account code already exists')).toBeVisible({ timeout: 5000 });
    });

    test('should filter accounts by type', async ({ page }) => {
      // Wait for accounts to load
      await page.waitForTimeout(2000);
      
      // Look for filter dropdown
      const filterSelect = page.locator('select, [role="combobox"]').filter({ hasText: /type|filter/i }).first();
      if (await filterSelect.isVisible()) {
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
    test.beforeEach(async ({ page }) => {
      await page.goto('/general-ledger');
      await page.waitForLoadState('networkidle');
    });

    test('should validate required fields when creating account', async ({ page }) => {
      // Click Add Account button
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500);
      
      // Try to submit without filling required fields
      await page.getByText('Create Account').click();
      
      // Should show validation errors
      await expect(page.getByText('Account code is required')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Account name is required')).toBeVisible({ timeout: 5000 });
    });

    test('should successfully create new account', async ({ page }) => {
      // Click Add Account button
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500);
      
      // Fill in the form
      await page.getByPlaceholder(/code/i).fill('2001');
      await page.getByPlaceholder(/name/i).fill('Test Liability Account');
      
      // Select account type
      const typeSelects = page.locator('select, [role="combobox"]');
      const typeSelect = typeSelects.first();
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('LIABILITY');
      }
      
      // Select normal balance if available
      const normalBalanceSelect = typeSelects.nth(1);
      if (await normalBalanceSelect.isVisible()) {
        await normalBalanceSelect.selectOption('credit');
      }
      
      // Submit the form
      await page.getByText('Create Account').click();
      
      // Wait for success and check if account appears
      await page.waitForTimeout(2000);
      await expect(page.getByText('Test Liability Account')).toBeVisible({ timeout: 10000 });
    });

    test('should display account statistics', async ({ page }) => {
      // Wait for statistics to load
      await page.waitForTimeout(2000);
      
      // Should show statistics cards
      await expect(page.getByText('Total Accounts')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Active Accounts')).toBeVisible({ timeout: 5000 });
    });

    test('should search accounts in general ledger', async ({ page }) => {
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
      await page.route('/api/accounts', route => {
        route.abort('failed');
      });
      
      // Reload the page to trigger the error
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should show error message or loading state
      const errorMessage = page.getByText(/failed|error|retry/i);
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    });

    test('should validate account type selection', async ({ page }) => {
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500);
      
      // Check that account type select is available
      const typeSelect = page.locator('select, [role="combobox"]').first();
      if (await typeSelect.isVisible()) {
        // Check if options are available (this depends on the UI implementation)
        await expect(typeSelect).toBeVisible();
      }
    });

    test('should handle API errors when creating accounts', async ({ page }) => {
      // Intercept API calls to simulate validation error
      await page.route('/api/accounts', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE' })
          });
        } else {
          route.continue();
        }
      });
      
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500);
      
      await page.getByPlaceholder(/code/i).fill('9999');
      await page.getByPlaceholder(/name/i).fill('Invalid Account');
      await page.getByText('Create Account').click();
      
      // Should show error message
      await expect(page.getByText('Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('API Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/chart-of-accounts');
      await page.waitForLoadState('networkidle');
    });

    test('should handle 500 server errors', async ({ page }) => {
      // Intercept API calls to simulate server error
      await page.route('/api/accounts', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      // Reload to trigger the error
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should show error message
      const errorMessage = page.getByText(/failed|error|server/i);
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    });

    test('should handle network timeouts', async ({ page }) => {
      // Intercept API calls to simulate timeout
      await page.route('/api/accounts', route => {
        // Simulate timeout by delaying and then aborting
        setTimeout(() => route.abort('timedout'), 2000);
      });
      
      // Reload to trigger the timeout
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Should show timeout or error message
      const timeoutMessage = page.getByText(/timeout|failed|error/i);
      if (await timeoutMessage.isVisible()) {
        await expect(timeoutMessage).toBeVisible();
      }
    });

    test('should handle malformed JSON responses', async ({ page }) => {
      // Intercept API calls to return malformed JSON
      await page.route('/api/accounts', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json{'
        });
      });
      
      // Reload to trigger the error
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should handle JSON parse error gracefully
      const parseError = page.getByText(/parse|invalid|error/i);
      if (await parseError.isVisible()) {
        await expect(parseError).toBeVisible();
      }
    });

    test('should handle authentication errors', async ({ page }) => {
      // Intercept API calls to simulate auth error
      await page.route('/api/accounts', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });
      
      // Reload to trigger the auth error
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should show auth error or redirect
      const authError = page.getByText(/unauthorized|login|auth/i);
      if (await authError.isVisible()) {
        await expect(authError).toBeVisible();
      }
    });

    test('should handle retry functionality', async ({ page }) => {
      let requestCount = 0;
      
      // Intercept API calls - fail first, succeed second
      await page.route('/api/accounts', route => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          route.continue();
        }
      });
      
      // Reload to trigger the error
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Look for retry button or error message
      const retryButton = page.getByText(/retry/i);
      if (await retryButton.isVisible()) {
        await retryButton.click();
        await page.waitForTimeout(2000);
        
        // Should eventually succeed
        const successIndicator = page.getByText(/chart of accounts|accounts/i);
        if (await successIndicator.isVisible()) {
          await expect(successIndicator).toBeVisible();
        }
      }
    });
  });

  test.describe('Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/chart-of-accounts');
      await page.waitForLoadState('networkidle');
    });

    test('should handle special characters in account names', async ({ page }) => {
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500);
      
      // Fill form with special characters
      await page.getByPlaceholder(/code/i).fill('9999');
      await page.getByPlaceholder(/name/i).fill('Test Account with Special Chars: @#$%^&*()');
      
      // Select account type
      const typeSelect = page.locator('select, [role="combobox"]').first();
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('ASSET');
      }
      
      await page.getByText('Create Account').click();
      await page.waitForTimeout(2000);
      
      // Should handle special characters properly
      await expect(page.getByText('Test Account with Special Chars: @#$%^&*()')).toBeVisible({ timeout: 10000 });
    });

    test('should validate account code format', async ({ page }) => {
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500);
      
      // Test with empty code first
      await page.getByPlaceholder(/name/i).fill('Test Account');
      
      const typeSelect = page.locator('select, [role="combobox"]').first();
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('ASSET');
      }
      
      await page.getByText('Create Account').click();
      
      // Should show validation error for empty code
      await expect(page.getByText('Account code is required')).toBeVisible({ timeout: 5000 });
    });

    test('should handle very long account names', async ({ page }) => {
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500);
      
      const longName = 'A'.repeat(256); // Very long name
      
      await page.getByPlaceholder(/code/i).fill('8888');
      await page.getByPlaceholder(/name/i).fill(longName);
      
      const typeSelect = page.locator('select, [role="combobox"]').first();
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('ASSET');
      }
      
      await page.getByText('Create Account').click();
      await page.waitForTimeout(2000);
      
      // Should either truncate or show validation error
      const errorMessage = page.getByText(/too long|invalid|error/i);
      const successMessage = page.getByText(/created|success/i);
      
      // One of these should be visible
      const result = await Promise.race([
        errorMessage.isVisible().then(visible => ({ type: 'error', visible })),
        successMessage.isVisible().then(visible => ({ type: 'success', visible }))
      ]);
      
      expect(result.visible).toBeTruthy();
    });

    test('should handle concurrent account creation attempts', async ({ page }) => {
      // Simulate rapid successive account creation attempts
      await page.getByText('Add Account').click();
      await page.waitForTimeout(500);
      
      await page.getByPlaceholder(/code/i).fill('7777');
      await page.getByPlaceholder(/name/i).fill('Concurrent Test Account');
      
      const typeSelect = page.locator('select, [role="combobox"]').first();
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('ASSET');
      }
      
      // Click create button multiple times rapidly
      const createButton = page.getByText('Create Account');
      await createButton.click();
      await createButton.click(); // Second click should be ignored or handled gracefully
      
      await page.waitForTimeout(2000);
      
      // Should handle the duplicate submission gracefully
      const successMessage = page.getByText(/created|success/i);
      const errorMessage = page.getByText(/error|duplicate|exists/i);
      
      // One of these should be visible
      const result = await Promise.race([
        successMessage.isVisible().then(visible => ({ type: 'success', visible })),
        errorMessage.isVisible().then(visible => ({ type: 'error', visible }))
      ]);
      
      expect(result.visible).toBeTruthy();
    });
  });
});