import { BasePage } from './base.page';
import { Page, Locator, expect } from '@playwright/test';
import { testData } from '../fixtures/test-data';

/**
 * Chart of Accounts page object model
 * Handles account management functionality
 */
export class ChartOfAccountsPage extends BasePage {
  private readonly pageTitle: Locator;
  private readonly accountsTable: Locator;
  private readonly addAccountButton: Locator;
  private readonly searchInput: Locator;
  private readonly accountForm: Locator;

  constructor(page: Page) {
    super(page, '/chart-of-accounts');
    this.pageTitle = page.locator('h1, h2').first();
    this.accountsTable = page.locator('table, [data-testid="accounts-table"]');
    this.addAccountButton = page.locator('button:has-text("Add Account"), [data-testid="add-account"]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
    this.accountForm = page.locator('form, [data-testid="account-form"]');
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/Chart of Accounts/);
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toContainText(/Chart of Accounts|Accounts/);
  }

  async verifyAccountsTableExists(): Promise<void> {
    await expect(this.accountsTable).toBeVisible({ timeout: 10000 });
    
    // Check for table headers
    const expectedHeaders = ['Name', 'Type', 'Code', 'Balance'];
    for (const header of expectedHeaders) {
      const headerElement = this.page.locator(`th:has-text("${header}"), [data-testid="header-${header.toLowerCase()}"]`);
      await expect(headerElement).toBeVisible();
    }
  }

  async addNewAccount(): Promise<void> {
    await this.addAccountButton.click();
    await expect(this.accountForm).toBeVisible();
    
    const { sample } = testData.accounts;
    
    // Fill account form
    await this.fillInput('input[name="name"], [data-testid="account-name"]', sample.name);
    await this.fillInput('input[name="code"], [data-testid="account-code"]', sample.code);
    await this.fillInput('textarea[name="description"], [data-testid="account-description"]', sample.description);
    
    // Select account type
    const typeSelect = this.page.locator('select[name="type"], [data-testid="account-type"]');
    await typeSelect.selectOption(sample.type);
    
    // Submit form
    const submitButton = this.page.locator('button[type="submit"], [data-testid="submit-account"]');
    await submitButton.click();
    
    // Wait for form to close or success message
    await this.page.waitForTimeout(1000);
  }

  async searchAccounts(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500); // Wait for search results
  }

  async verifyAccountExists(accountName: string): Promise<void> {
    const accountRow = this.page.locator(`tr:has-text("${accountName}")`);
    await expect(accountRow).toBeVisible();
  }

  async deleteAccount(accountName: string): Promise<void> {
    const accountRow = this.page.locator(`tr:has-text("${accountName}")`);
    const deleteButton = accountRow.locator('button:has-text("Delete"), [data-testid="delete-account"]');
    
    await deleteButton.click();
    
    // Handle confirmation dialog if present
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Delete"), [data-testid="confirm-delete"]');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    await this.page.waitForTimeout(1000);
  }

  async verifyAccountDeleted(accountName: string): Promise<void> {
    const accountRow = this.page.locator(`tr:has-text("${accountName}")`);
    await expect(accountRow).not.toBeVisible();
  }

  async exportAccounts(): Promise<void> {
    await this.clickElement('[data-testid="export-accounts"]');
    // Wait for download to start
    await this.page.waitForTimeout(1000);
  }

  async checkResponsiveDesign(): Promise<void> {
    await super.checkResponsiveDesign();
    
    // Additional chart of accounts specific responsive checks
    await this.page.setViewportSize({ width: 375, height: 667 });
    const mobileTable = await this.isVisible('[data-testid="accounts-table"]');
    expect(mobileTable).toBe(true);
  }

  async verifyAccountTypes(): Promise<void> {
    const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    
    // Check if account type filter or dropdown exists
    const typeFilter = this.page.locator('select[name="type"], [data-testid="type-filter"]');
    if (await typeFilter.isVisible({ timeout: 2000 })) {
      for (const type of accountTypes) {
        const option = typeFilter.locator(`option[value="${type}"]`);
        await expect(option).toBeVisible();
      }
    }
  }

  async filterByAccountType(accountType: string): Promise<void> {
    const typeFilter = this.page.locator('select[name="type"], [data-testid="type-filter"]');
    if (await typeFilter.isVisible({ timeout: 2000 })) {
      await typeFilter.selectOption(accountType);
      await this.page.waitForTimeout(500); // Wait for filter to apply
    }
  }
}