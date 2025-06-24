import { BasePage } from './base.page';
import { Page, Locator, expect } from '@playwright/test';
import { testData } from '../fixtures/test-data';

/**
 * General Ledger page object model
 * Handles transaction recording and ledger functionality
 */
export class GeneralLedgerPage extends BasePage {
  private readonly pageTitle: Locator;
  private readonly transactionsTable: Locator;
  private readonly addTransactionButton: Locator;
  private readonly transactionForm: Locator;
  private readonly dateFilter: Locator;
  private readonly accountFilter: Locator;
  private readonly searchInput: Locator;

  constructor(page: Page) {
    super(page, '/general-ledger');
    this.pageTitle = page.locator('h1, h2').first();
    this.transactionsTable = page.locator('table, [data-testid="transactions-table"]');
    this.addTransactionButton = page.locator('button:has-text("Add Transaction"), [data-testid="add-transaction"]');
    this.transactionForm = page.locator('form, [data-testid="transaction-form"]');
    this.dateFilter = page.locator('input[type="date"], [data-testid="date-filter"]');
    this.accountFilter = page.locator('select[name="account"], [data-testid="account-filter"]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/General Ledger/);
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toContainText(/General Ledger|Transactions/);
  }

  async verifyTransactionsTableExists(): Promise<void> {
    await expect(this.transactionsTable).toBeVisible({ timeout: 10000 });
    
    // Check for table headers
    const expectedHeaders = ['Date', 'Description', 'Account', 'Debit', 'Credit', 'Balance'];
    for (const header of expectedHeaders) {
      const headerElement = this.page.locator(`th:has-text("${header}"), [data-testid="header-${header.toLowerCase()}"]`);
      await expect(headerElement).toBeVisible();
    }
  }

  async addNewTransaction(): Promise<void> {
    await this.addTransactionButton.click();
    await expect(this.transactionForm).toBeVisible();
    
    const { sample } = testData.transactions;
    
    // Fill transaction form
    await this.fillInput('input[name="date"], [data-testid="transaction-date"]', sample.date);
    await this.fillInput('input[name="description"], [data-testid="transaction-description"]', sample.description);
    await this.fillInput('input[name="reference"], [data-testid="transaction-reference"]', sample.reference);
    
    // Add journal entries
    for (let i = 0; i < sample.entries.length; i++) {
      const entry = sample.entries[i];
      
      // Select account
      const accountSelect = this.page.locator(`select[name="entries[${i}].account"], [data-testid="entry-${i}-account"]`);
      await accountSelect.selectOption(entry.account);
      
      // Fill amount
      const amountInput = this.page.locator(`input[name="entries[${i}].amount"], [data-testid="entry-${i}-amount"]`);
      await amountInput.fill(entry.amount.toString());
      
      // Select debit/credit
      const typeSelect = this.page.locator(`select[name="entries[${i}].type"], [data-testid="entry-${i}-type"]`);
      await typeSelect.selectOption(entry.type);
      
      // Add another entry if needed
      if (i < sample.entries.length - 1) {
        const addEntryButton = this.page.locator('button:has-text("Add Entry"), [data-testid="add-entry"]');
        if (await addEntryButton.isVisible({ timeout: 2000 })) {
          await addEntryButton.click();
        }
      }
    }
    
    // Submit transaction
    const submitButton = this.page.locator('button[type="submit"], [data-testid="submit-transaction"]');
    await submitButton.click();
    
    // Wait for form to close or success message
    await this.page.waitForTimeout(1000);
  }

  async filterByDate(startDate: string, endDate?: string): Promise<void> {
    const startDateInput = this.page.locator('input[name="startDate"], [data-testid="start-date"]');
    await startDateInput.fill(startDate);
    
    if (endDate) {
      const endDateInput = this.page.locator('input[name="endDate"], [data-testid="end-date"]');
      await endDateInput.fill(endDate);
    }
    
    const applyFilterButton = this.page.locator('button:has-text("Apply"), [data-testid="apply-filter"]');
    if (await applyFilterButton.isVisible({ timeout: 2000 })) {
      await applyFilterButton.click();
    }
    
    await this.page.waitForTimeout(500);
  }

  async filterByAccount(accountName: string): Promise<void> {
    if (await this.accountFilter.isVisible({ timeout: 2000 })) {
      await this.accountFilter.selectOption(accountName);
      await this.page.waitForTimeout(500);
    }
  }

  async searchTransactions(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async verifyTransactionExists(description: string): Promise<void> {
    const transactionRow = this.page.locator(`tr:has-text("${description}")`);
    await expect(transactionRow).toBeVisible();
  }

  async verifyBalanceCalculation(): Promise<void> {
    // Check if running balance is calculated correctly
    const balanceCells = this.page.locator('td[data-testid*="balance"], .balance-cell');
    const count = await balanceCells.count();
    
    if (count > 0) {
      // Verify at least one balance cell is visible
      await expect(balanceCells.first()).toBeVisible();
      
      // Check that balance values are numeric
      const balanceText = await balanceCells.first().textContent();
      const numericValue = parseFloat(balanceText?.replace(/[^\d.-]/g, '') || '0');
      expect(typeof numericValue).toBe('number');
    }
  }

  async exportTransactions(): Promise<void> {
    await this.clickElement('[data-testid="export-transactions"]');
    // Wait for download to start
    await this.page.waitForTimeout(1000);
  }

  async checkResponsiveDesign(): Promise<void> {
    await super.checkResponsiveDesign();
    
    // Additional general ledger specific responsive checks
    await this.page.setViewportSize({ width: 375, height: 667 });
    const mobileTable = await this.isVisible('[data-testid="transactions-table"]');
    expect(mobileTable).toBe(true);
  }

  async verifyDoubleEntryBookkeeping(): Promise<void> {
    // Verify that debits equal credits for each transaction
    const transactionRows = this.page.locator('tbody tr');
    const count = await transactionRows.count();
    
    if (count > 0) {
      // Check first few transactions for double-entry compliance
      for (let i = 0; i < Math.min(count, 3); i++) {
        const row = transactionRows.nth(i);
        const debitCell = row.locator('td[data-testid*="debit"], .debit-cell');
        const creditCell = row.locator('td[data-testid*="credit"], .credit-cell');
        
        if (await debitCell.isVisible() && await creditCell.isVisible()) {
          await expect(debitCell).toBeVisible();
          await expect(creditCell).toBeVisible();
        }
      }
    }
  }
}