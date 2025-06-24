import { test, expect } from '@playwright/test';
import { FinancialStatementsPage } from './pages/financial-statements.page';

test.describe('Financial Statements E2E Tests', () => {
  let statementsPage: FinancialStatementsPage;

  test.beforeEach(async ({ page }) => {
    statementsPage = new FinancialStatementsPage(page);
    await statementsPage.goto();
  });

  test('should load financial statements page successfully', async () => {
    await statementsPage.verifyPageLoaded();
  });

  test('should display all statement types', async () => {
    await statementsPage.verifyStatementTypes();
  });

  test('should generate balance sheet successfully', async () => {
    await statementsPage.generateBalanceSheet('2024-01-01', '2024-12-31');
    await statementsPage.verifyBalanceSheetStructure();
  });

  test('should generate income statement successfully', async () => {
    await statementsPage.generateIncomeStatement('2024-01-01', '2024-12-31');
    await statementsPage.verifyIncomeStatementStructure();
  });

  test('should generate cash flow statement successfully', async () => {
    await statementsPage.generateCashFlowStatement('2024-01-01', '2024-12-31');
    await statementsPage.verifyCashFlowStructure();
  });

  test('should validate balance sheet accounting equation', async () => {
    await statementsPage.generateBalanceSheet('2024-01-01', '2024-12-31');
    
    // The verifyBalanceSheetStructure method includes balance equation validation
    await statementsPage.verifyBalanceSheetStructure();
  });

  test('should handle different date ranges', async () => {
    const dateRanges = [
      { start: '2024-01-01', end: '2024-03-31' }, // Q1
      { start: '2024-04-01', end: '2024-06-30' }, // Q2
      { start: '2024-07-01', end: '2024-09-30' }, // Q3
      { start: '2024-10-01', end: '2024-12-31' }  // Q4
    ];

    for (const range of dateRanges) {
      await statementsPage.generateBalanceSheet(range.start, range.end);
      
      // Verify statement content is displayed
      const statementContent = statementsPage.page.locator('[data-testid="statement-content"], .statement-content, .financial-statement');
      await expect(statementContent).toBeVisible({ timeout: 15000 });
    }
  });

  test('should validate statement accuracy and formatting', async () => {
    await statementsPage.generateBalanceSheet('2024-01-01', '2024-12-31');
    await statementsPage.verifyStatementAccuracy();
  });

  test('should export statements in different formats', async () => {
    await statementsPage.generateBalanceSheet('2024-01-01', '2024-12-31');
    
    const formats: Array<'PDF' | 'Excel' | 'CSV'> = ['PDF', 'Excel', 'CSV'];
    
    for (const format of formats) {
      await statementsPage.exportStatement(format);
      // Note: In a real test, you might want to verify the download
    }
  });

  test('should print statements', async () => {
    await statementsPage.generateBalanceSheet('2024-01-01', '2024-12-31');
    await statementsPage.printStatement();
  });

  test('should handle empty data gracefully', async () => {
    // Generate statement for a period with no data
    await statementsPage.generateBalanceSheet('2025-01-01', '2025-01-31');
    
    const statementContent = statementsPage.page.locator('[data-testid="statement-content"], .statement-content, .financial-statement');
    
    // Should either show empty state or zero values
    const isEmpty = await statementsPage.page.locator('text=/no data|empty|no transactions/i').isVisible({ timeout: 5000 });
    const hasZeroValues = await statementContent.isVisible({ timeout: 5000 });
    
    expect(isEmpty || hasZeroValues).toBeTruthy();
  });

  test('should validate date range inputs', async () => {
    const statementSelector = statementsPage.page.locator('select[name="statementType"], [data-testid="statement-selector"]');
    await statementSelector.selectOption('Balance Sheet');
    
    // Try invalid date range (end before start)
    const startDateInput = statementsPage.page.locator('input[name="startDate"], [data-testid="start-date"]');
    const endDateInput = statementsPage.page.locator('input[name="endDate"], [data-testid="end-date"]');
    
    if (await startDateInput.isVisible({ timeout: 2000 }) && await endDateInput.isVisible({ timeout: 2000 })) {
      await startDateInput.fill('2024-12-31');
      await endDateInput.fill('2024-01-01');
      
      const generateButton = statementsPage.page.locator('button:has-text("Generate"), [data-testid="generate-statement"]');
      await generateButton.click();
      
      // Should show validation error
      const dateError = statementsPage.page.locator('text=/invalid.*date|end.*before.*start/i');
      await expect(dateError).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle concurrent statement generation', async () => {
    // Test that multiple rapid requests are handled properly
    const generateButton = statementsPage.page.locator('button:has-text("Generate"), [data-testid="generate-statement"]');
    
    // Rapid clicks should not cause issues
    await generateButton.click();
    await generateButton.click();
    await generateButton.click();
    
    // Should eventually show statement content
    const statementContent = statementsPage.page.locator('[data-testid="statement-content"], .statement-content, .financial-statement');
    await expect(statementContent).toBeVisible({ timeout: 20000 });
  });

  test('should maintain statement formatting across browsers', async () => {
    await statementsPage.generateBalanceSheet('2024-01-01', '2024-12-31');
    
    // Check that statement maintains proper formatting
    const statementContent = statementsPage.page.locator('[data-testid="statement-content"], .statement-content, .financial-statement');
    await expect(statementContent).toBeVisible();
    
    // Verify table structure if present
    const tables = statementsPage.page.locator('table');
    const tableCount = await tables.count();
    
    if (tableCount > 0) {
      const firstTable = tables.first();
      await expect(firstTable).toBeVisible();
      
      // Check for proper table headers
      const headers = firstTable.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    }
  });

  test('should handle large datasets efficiently', async () => {
    const startTime = Date.now();
    
    await statementsPage.generateBalanceSheet('2020-01-01', '2024-12-31');
    
    const endTime = Date.now();
    const generationTime = endTime - startTime;
    
    // Statement should generate within reasonable time (30 seconds)
    expect(generationTime).toBeLessThan(30000);
    
    // Verify content is displayed
    const statementContent = statementsPage.page.locator('[data-testid="statement-content"], .statement-content, .financial-statement');
    await expect(statementContent).toBeVisible();
  });

  test('should support comparative statements', async () => {
    // Test if comparative periods are supported
    const comparativeOption = statementsPage.page.locator('input[type="checkbox"]:has-text("Comparative"), [data-testid="comparative-periods"]');
    
    if (await comparativeOption.isVisible({ timeout: 2000 })) {
      await comparativeOption.check();
      
      await statementsPage.generateBalanceSheet('2024-01-01', '2024-12-31');
      
      // Verify comparative columns are shown
      const statementContent = statementsPage.page.locator('[data-testid="statement-content"], .statement-content, .financial-statement');
      await expect(statementContent).toBeVisible();
      
      // Look for multiple year columns
      const yearHeaders = statementsPage.page.locator('th:has-text("2024"), th:has-text("2023")');
      const hasComparativeColumns = await yearHeaders.count() > 1;
      expect(hasComparativeColumns).toBeTruthy();
    }
  });

  test('should meet accessibility standards', async () => {
    await statementsPage.checkAccessibility();
  });

  test('should be responsive', async () => {
    await statementsPage.checkResponsiveDesign();
  });
});

test.describe('Financial Statements Visual Regression Tests', () => {
  test('should match balance sheet screenshot', async ({ page }) => {
    const statementsPage = new FinancialStatementsPage(page);
    await statementsPage.goto();
    await statementsPage.generateBalanceSheet('2024-01-01', '2024-12-31');
    
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('balance-sheet.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match income statement screenshot', async ({ page }) => {
    const statementsPage = new FinancialStatementsPage(page);
    await statementsPage.goto();
    await statementsPage.generateIncomeStatement('2024-01-01', '2024-12-31');
    
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('income-statement.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match cash flow statement screenshot', async ({ page }) => {
    const statementsPage = new FinancialStatementsPage(page);
    await statementsPage.goto();
    await statementsPage.generateCashFlowStatement('2024-01-01', '2024-12-31');
    
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('cash-flow-statement.png', {
      fullPage: true,
      threshold: 0.3
    });
  });
});