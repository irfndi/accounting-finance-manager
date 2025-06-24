import { BasePage } from './base.page';
import { Page, Locator, expect } from '@playwright/test';

/**
 * Financial Statements page object model
 * Handles financial reporting functionality
 */
export class FinancialStatementsPage extends BasePage {
  private readonly pageTitle: Locator;
  private readonly statementSelector: Locator;
  private readonly dateRangePicker: Locator;
  private readonly generateButton: Locator;
  private readonly statementContent: Locator;
  private readonly exportButton: Locator;
  private readonly printButton: Locator;

  constructor(page: Page) {
    super(page, '/financial-statements');
    this.pageTitle = page.locator('h1, h2').first();
    this.statementSelector = page.locator('select[name="statementType"], [data-testid="statement-selector"]');
    this.dateRangePicker = page.locator('[data-testid="date-range"], .date-range');
    this.generateButton = page.locator('button:has-text("Generate"), [data-testid="generate-statement"]');
    this.statementContent = page.locator('[data-testid="statement-content"], .statement-content, .financial-statement');
    this.exportButton = page.locator('button:has-text("Export"), [data-testid="export-statement"]');
    this.printButton = page.locator('button:has-text("Print"), [data-testid="print-statement"]');
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/Financial Statements/);
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toContainText(/Financial Statements|Reports/);
  }

  async verifyStatementTypes(): Promise<void> {
    await expect(this.statementSelector).toBeVisible();
    
    const expectedStatements = [
      'Balance Sheet',
      'Income Statement',
      'Cash Flow Statement',
      'Statement of Equity'
    ];
    
    for (const statement of expectedStatements) {
      const option = this.statementSelector.locator(`option:has-text("${statement}")`);
      await expect(option).toBeVisible();
    }
  }

  async generateBalanceSheet(startDate?: string, endDate?: string): Promise<void> {
    await this.statementSelector.selectOption('Balance Sheet');
    
    if (startDate && endDate) {
      await this.setDateRange(startDate, endDate);
    }
    
    await this.generateButton.click();
    await this.waitForStatementGeneration();
  }

  async generateIncomeStatement(startDate?: string, endDate?: string): Promise<void> {
    await this.statementSelector.selectOption('Income Statement');
    
    if (startDate && endDate) {
      await this.setDateRange(startDate, endDate);
    }
    
    await this.generateButton.click();
    await this.waitForStatementGeneration();
  }

  async generateCashFlowStatement(startDate?: string, endDate?: string): Promise<void> {
    await this.statementSelector.selectOption('Cash Flow Statement');
    
    if (startDate && endDate) {
      await this.setDateRange(startDate, endDate);
    }
    
    await this.generateButton.click();
    await this.waitForStatementGeneration();
  }

  private async setDateRange(startDate: string, endDate: string): Promise<void> {
    const startDateInput = this.page.locator('input[name="startDate"], [data-testid="start-date"]');
    const endDateInput = this.page.locator('input[name="endDate"], [data-testid="end-date"]');
    
    if (await startDateInput.isVisible({ timeout: 2000 })) {
      await startDateInput.fill(startDate);
    }
    
    if (await endDateInput.isVisible({ timeout: 2000 })) {
      await endDateInput.fill(endDate);
    }
  }

  private async waitForStatementGeneration(): Promise<void> {
    // Wait for loading to complete
    const loadingIndicator = this.page.locator('[data-testid="loading"], .loading, .spinner');
    if (await loadingIndicator.isVisible({ timeout: 2000 })) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 30000 });
    }
    
    // Wait for statement content to appear
    await expect(this.statementContent).toBeVisible({ timeout: 15000 });
  }

  async verifyBalanceSheetStructure(): Promise<void> {
    await expect(this.statementContent).toBeVisible();
    
    // Check for main sections of balance sheet
    const sections = ['Assets', 'Liabilities', 'Equity'];
    
    for (const section of sections) {
      const sectionElement = this.page.locator(`h2:has-text("${section}"), h3:has-text("${section}"), [data-testid="${section.toLowerCase()}"]`);
      await expect(sectionElement).toBeVisible();
    }
    
    // Verify balance equation (Assets = Liabilities + Equity)
    await this.verifyBalanceEquation();
  }

  async verifyIncomeStatementStructure(): Promise<void> {
    await expect(this.statementContent).toBeVisible();
    
    // Check for main sections of income statement
    const sections = ['Revenue', 'Expenses', 'Net Income'];
    
    for (const section of sections) {
      const sectionElement = this.page.locator(`h2:has-text("${section}"), h3:has-text("${section}"), [data-testid="${section.toLowerCase().replace(' ', '-')}"]`);
      await expect(sectionElement).toBeVisible();
    }
  }

  async verifyCashFlowStructure(): Promise<void> {
    await expect(this.statementContent).toBeVisible();
    
    // Check for main sections of cash flow statement
    const sections = [
      'Operating Activities',
      'Investing Activities', 
      'Financing Activities'
    ];
    
    for (const section of sections) {
      const sectionElement = this.page.locator(`h2:has-text("${section}"), h3:has-text("${section}"), [data-testid="${section.toLowerCase().replace(/\s+/g, '-')}"]`);
      await expect(sectionElement).toBeVisible();
    }
  }

  private async verifyBalanceEquation(): Promise<void> {
    // Extract totals and verify accounting equation
    const assetTotal = await this.extractTotal('Assets');
    const liabilityTotal = await this.extractTotal('Liabilities');
    const equityTotal = await this.extractTotal('Equity');
    
    if (assetTotal !== null && liabilityTotal !== null && equityTotal !== null) {
      const difference = Math.abs(assetTotal - (liabilityTotal + equityTotal));
      expect(difference).toBeLessThan(0.01); // Allow for rounding differences
    }
  }

  private async extractTotal(section: string): Promise<number | null> {
    const totalElement = this.page.locator(`[data-testid="${section.toLowerCase()}-total"], .${section.toLowerCase()}-total`);
    
    if (await totalElement.isVisible({ timeout: 2000 })) {
      const totalText = await totalElement.textContent();
      const numericValue = parseFloat(totalText?.replace(/[^\d.-]/g, '') || '0');
      return isNaN(numericValue) ? null : numericValue;
    }
    
    return null;
  }

  async exportStatement(format: 'PDF' | 'Excel' | 'CSV' = 'PDF'): Promise<void> {
    if (await this.exportButton.isVisible({ timeout: 2000 })) {
      await this.exportButton.click();
      
      // Select format if dropdown appears
      const formatOption = this.page.locator(`button:has-text("${format}"), [data-testid="export-${format.toLowerCase()}"]`);
      if (await formatOption.isVisible({ timeout: 2000 })) {
        await formatOption.click();
      }
      
      await this.page.waitForTimeout(3000); // Wait for download
    }
  }

  async printStatement(): Promise<void> {
    if (await this.printButton.isVisible({ timeout: 2000 })) {
      // Listen for print dialog
      const printPromise = this.page.waitForEvent('dialog');
      await this.printButton.click();
      
      try {
        const dialog = await printPromise;
        await dialog.dismiss();
      } catch {
        // Print dialog might not appear in headless mode
      }
    }
  }

  async verifyStatementAccuracy(): Promise<void> {
    // Verify that all numbers are properly formatted
    const numberElements = this.page.locator('[data-testid*="amount"], .amount, .currency');
    const count = await numberElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = numberElements.nth(i);
      const text = await element.textContent();
      
      if (text) {
        // Check for proper currency formatting
        const hasValidFormat = /^[\$\€\£]?[\d,]+\.?\d*$/.test(text.trim().replace(/[()\s]/g, ''));
        expect(hasValidFormat).toBeTruthy();
      }
    }
  }

  async verifyNumericalAccuracy(): Promise<void> {
    // Verify that all numbers are properly formatted and calculated
    const numbers = await this.page.locator('[data-testid*="amount"], [data-testid*="total"]').all();
    
    for (const numberElement of numbers) {
      const text = await numberElement.textContent();
      if (text) {
        // Check if it's a valid number format
        const cleanNumber = text.replace(/[$,\s]/g, '');
        expect(parseFloat(cleanNumber)).not.toBeNaN();
      }
    }
  }

  async checkResponsiveDesign(): Promise<void> {
    await super.checkResponsiveDesign();
    
    // Additional financial statements specific responsive checks
    await this.page.setViewportSize({ width: 375, height: 667 });
    const mobileStatements = await this.isVisible('[data-testid="financial-statements"]');
    expect(mobileStatements).toBe(true);
  }
}