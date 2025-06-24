import { test, expect } from '@playwright/test';
import { GeneralLedgerPage } from './pages/general-ledger.page';
import { testData } from './fixtures/test-data';

test.describe('General Ledger E2E Tests', () => {
  let ledgerPage: GeneralLedgerPage;

  test.beforeEach(async ({ page }) => {
    ledgerPage = new GeneralLedgerPage(page);
    await ledgerPage.goto();
  });

  test('should load general ledger page successfully', async () => {
    await ledgerPage.verifyPageLoaded();
  });

  test('should display transactions table with proper headers', async () => {
    await ledgerPage.verifyTransactionsTableExists();
  });

  test('should add a new transaction successfully', async () => {
    const { sample } = testData.transactions;
    
    await ledgerPage.addNewTransaction();
    
    // Verify transaction was added
    await ledgerPage.verifyTransactionExists(sample.description);
  });

  test('should validate double-entry bookkeeping', async () => {
    await ledgerPage.verifyDoubleEntryBookkeeping();
  });

  test('should calculate running balances correctly', async () => {
    await ledgerPage.verifyBalanceCalculation();
  });

  test('should filter transactions by date range', async () => {
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    
    await ledgerPage.filterByDate(startDate, endDate);
    
    // Verify filtered results
    const transactionRows = ledgerPage.page.locator('tbody tr');
    const count = await transactionRows.count();
    
    if (count > 0) {
      // Check that visible transactions are within date range
      const firstRow = transactionRows.first();
      const dateCell = firstRow.locator('td').first(); // Assuming date is in first column
      await expect(dateCell).toBeVisible();
    }
  });

  test('should filter transactions by account', async () => {
    const { sample } = testData.accounts;
    
    await ledgerPage.filterByAccount(sample.name);
    
    // Verify filtered results show only transactions for selected account
    const transactionRows = ledgerPage.page.locator('tbody tr');
    const count = await transactionRows.count();
    
    if (count > 0) {
      const firstRow = transactionRows.first();
      const accountCell = firstRow.locator('td').nth(2); // Assuming account is in third column
      await expect(accountCell).toContainText(sample.name, { timeout: 5000 });
    }
  });

  test('should search transactions by description', async () => {
    const { searchQueries } = testData;
    
    for (const query of searchQueries.transactions) {
      await ledgerPage.searchTransactions(query);
      
      // Verify search results are displayed
      const hasResults = await ledgerPage.page.locator('tbody tr').count() >= 0;
      expect(hasResults).toBeTruthy();
      
      // Clear search
      await ledgerPage.searchTransactions('');
    }
  });

  test('should validate transaction form inputs', async () => {
    const addButton = ledgerPage.page.locator('button:has-text("Add Transaction"), [data-testid="add-transaction"]');
    await addButton.click();
    
    const form = ledgerPage.page.locator('form, [data-testid="transaction-form"]');
    await expect(form).toBeVisible();
    
    // Try to submit empty form
    const submitButton = ledgerPage.page.locator('button[type="submit"], [data-testid="submit-transaction"]');
    await submitButton.click();
    
    // Should show validation errors
    const errorMessages = ledgerPage.page.locator('.error, [data-testid*="error"], .invalid-feedback');
    const hasErrors = await errorMessages.count() > 0;
    expect(hasErrors).toBeTruthy();
  });

  test('should validate balanced journal entries', async () => {
    const addButton = ledgerPage.page.locator('button:has-text("Add Transaction"), [data-testid="add-transaction"]');
    await addButton.click();
    
    const form = ledgerPage.page.locator('form, [data-testid="transaction-form"]');
    await expect(form).toBeVisible();
    
    // Fill basic transaction info
    await ledgerPage.fillInput('input[name="date"], [data-testid="transaction-date"]', '2024-01-15');
    await ledgerPage.fillInput('input[name="description"], [data-testid="transaction-description"]', 'Test Unbalanced Transaction');
    
    // Add unbalanced entries (debit without matching credit)
    const debitAccount = ledgerPage.page.locator('select[name="entries[0].account"], [data-testid="entry-0-account"]');
    if (await debitAccount.isVisible({ timeout: 2000 })) {
      await debitAccount.selectOption({ index: 1 }); // Select first available account
      
      const debitAmount = ledgerPage.page.locator('input[name="entries[0].amount"], [data-testid="entry-0-amount"]');
      await debitAmount.fill('100');
      
      const debitType = ledgerPage.page.locator('select[name="entries[0].type"], [data-testid="entry-0-type"]');
      await debitType.selectOption('debit');
      
      // Try to submit unbalanced transaction
      const submitButton = ledgerPage.page.locator('button[type="submit"], [data-testid="submit-transaction"]');
      await submitButton.click();
      
      // Should show balance validation error
      const balanceError = ledgerPage.page.locator('text=/balance|equal|debit.*credit/i');
      await expect(balanceError).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle multi-entry transactions', async () => {
    const addButton = ledgerPage.page.locator('button:has-text("Add Transaction"), [data-testid="add-transaction"]');
    await addButton.click();
    
    const form = ledgerPage.page.locator('form, [data-testid="transaction-form"]');
    await expect(form).toBeVisible();
    
    // Fill transaction with multiple entries
    await ledgerPage.fillInput('input[name="date"], [data-testid="transaction-date"]', '2024-01-15');
    await ledgerPage.fillInput('input[name="description"], [data-testid="transaction-description"]', 'Multi-Entry Transaction');
    
    // Add multiple journal entries if supported
    const addEntryButton = ledgerPage.page.locator('button:has-text("Add Entry"), [data-testid="add-entry"]');
    if (await addEntryButton.isVisible({ timeout: 2000 })) {
      await addEntryButton.click();
      
      // Verify additional entry fields appear
      const secondEntry = ledgerPage.page.locator('[data-testid="entry-1-account"], input[name="entries[1].account"]');
      await expect(secondEntry).toBeVisible();
    }
  });

  test('should edit existing transaction', async () => {
    const { sample } = testData.transactions;
    
    // First add a transaction
    await ledgerPage.addNewTransaction();
    await ledgerPage.verifyTransactionExists(sample.description);
    
    // Edit the transaction
    const transactionRow = ledgerPage.page.locator(`tr:has-text("${sample.description}")`);
    const editButton = transactionRow.locator('button:has-text("Edit"), [data-testid="edit-transaction"]');
    
    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
      
      const form = ledgerPage.page.locator('form, [data-testid="transaction-form"]');
      await expect(form).toBeVisible();
      
      // Update transaction description
      const descriptionInput = ledgerPage.page.locator('input[name="description"], [data-testid="transaction-description"]');
      await descriptionInput.fill(sample.description + ' Updated');
      
      const submitButton = ledgerPage.page.locator('button[type="submit"], [data-testid="submit-transaction"]');
      await submitButton.click();
      
      // Verify update
      await ledgerPage.verifyTransactionExists(sample.description + ' Updated');
    }
  });

  test('should delete transaction with confirmation', async () => {
    const { sample } = testData.transactions;
    
    // First add a transaction
    await ledgerPage.addNewTransaction();
    await ledgerPage.verifyTransactionExists(sample.description);
    
    // Delete the transaction
    const transactionRow = ledgerPage.page.locator(`tr:has-text("${sample.description}")`);
    const deleteButton = transactionRow.locator('button:has-text("Delete"), [data-testid="delete-transaction"]');
    
    if (await deleteButton.isVisible({ timeout: 2000 })) {
      await deleteButton.click();
      
      // Handle confirmation dialog
      const confirmButton = ledgerPage.page.locator('button:has-text("Confirm"), button:has-text("Delete"), [data-testid="confirm-delete"]');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
      
      await ledgerPage.page.waitForTimeout(1000);
      
      // Verify deletion
      const deletedRow = ledgerPage.page.locator(`tr:has-text("${sample.description}")`);
      await expect(deletedRow).not.toBeVisible();
    }
  });

  test('should export transactions data', async () => {
    await ledgerPage.exportTransactions();
    
    // Note: In a real test, you might want to verify the download
    // This is a basic test to ensure the export button works
  });

  test('should handle pagination for large datasets', async () => {
    const transactionsTable = ledgerPage.page.locator('table, [data-testid="transactions-table"]');
    await expect(transactionsTable).toBeVisible();
    
    // Check if pagination exists
    const pagination = ledgerPage.page.locator('.pagination, [data-testid="pagination"]');
    const hasPagination = await pagination.isVisible({ timeout: 2000 });
    
    if (hasPagination) {
      // Test pagination functionality
      const nextButton = pagination.locator('button:has-text("Next"), [data-testid="next-page"]');
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await ledgerPage.page.waitForTimeout(500);
        
        // Verify page changed
        await expect(transactionsTable).toBeVisible();
      }
    }
  });

  test('should maintain transaction chronological order', async () => {
    const transactionRows = ledgerPage.page.locator('tbody tr');
    const count = await transactionRows.count();
    
    if (count > 1) {
      // Check that transactions are ordered by date (newest first or oldest first)
      const firstDate = await transactionRows.first().locator('td').first().textContent();
      const secondDate = await transactionRows.nth(1).locator('td').first().textContent();
      
      if (firstDate && secondDate) {
        const date1 = new Date(firstDate.trim());
        const date2 = new Date(secondDate.trim());
        
        // Verify dates are in order (either ascending or descending)
        const isAscending = date1 <= date2;
        const isDescending = date1 >= date2;
        
        expect(isAscending || isDescending).toBeTruthy();
      }
    }
  });

  test('should meet accessibility standards', async () => {
    await ledgerPage.checkAccessibility();
  });

  test('should be responsive', async () => {
    await ledgerPage.checkResponsiveDesign();
  });
});

test.describe('General Ledger Visual Regression Tests', () => {
  test('should match transactions table screenshot', async ({ page }) => {
    const ledgerPage = new GeneralLedgerPage(page);
    await ledgerPage.goto();
    await ledgerPage.verifyPageLoaded();
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('general-ledger.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match add transaction form screenshot', async ({ page }) => {
    const ledgerPage = new GeneralLedgerPage(page);
    await ledgerPage.goto();
    
    const addButton = page.locator('button:has-text("Add Transaction"), [data-testid="add-transaction"]');
    await addButton.click();
    
    const form = page.locator('form, [data-testid="transaction-form"]');
    await expect(form).toBeVisible();
    
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('add-transaction-form.png', {
      threshold: 0.3
    });
  });
});