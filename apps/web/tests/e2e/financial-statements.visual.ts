import { test, expect } from '@playwright/test';
import { FinancialStatementsPage } from './pages/financial-statements.page';

test.describe('Financial Statements Visual Regression Tests', () => {
  let financialStatementsPage: FinancialStatementsPage;

  test.beforeEach(async ({ page }) => {
    financialStatementsPage = new FinancialStatementsPage(page);
    await financialStatementsPage.goto();
    await financialStatementsPage.verifyPageLoaded();
  });

  test('should match financial statements desktop screenshot', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('financial-statements-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match financial statements mobile screenshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('financial-statements-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match balance sheet screenshot', async ({ page }) => {
    // Try to navigate to or show balance sheet
    const balanceSheetTab = page.locator('button:has-text("Balance Sheet"), [data-testid="balance-sheet"]').first();
    
    if (await balanceSheetTab.count() > 0) {
      await balanceSheetTab.click();
      await page.waitForTimeout(500);
    }
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Screenshot the balance sheet section
    const balanceSheet = page.locator('[data-testid="balance-sheet"], .balance-sheet, main').first();
    await expect(balanceSheet).toHaveScreenshot('financial-statements-balance-sheet.png', {
      animations: 'disabled',
    });
  });

  test('should match income statement screenshot', async ({ page }) => {
    // Try to navigate to or show income statement
    const incomeStatementTab = page.locator('button:has-text("Income Statement"), button:has-text("P&L"), [data-testid="income-statement"]').first();
    
    if (await incomeStatementTab.count() > 0) {
      await incomeStatementTab.click();
      await page.waitForTimeout(500);
    }
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Screenshot the income statement section
    const incomeStatement = page.locator('[data-testid="income-statement"], .income-statement, main').first();
    await expect(incomeStatement).toHaveScreenshot('financial-statements-income-statement.png', {
      animations: 'disabled',
    });
  });

  test('should match cash flow statement screenshot', async ({ page }) => {
    // Try to navigate to or show cash flow statement
    const cashFlowTab = page.locator('button:has-text("Cash Flow"), [data-testid="cash-flow"]').first();
    
    if (await cashFlowTab.count() > 0) {
      await cashFlowTab.click();
      await page.waitForTimeout(500);
    }
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Screenshot the cash flow section
    const cashFlow = page.locator('[data-testid="cash-flow"], .cash-flow, main').first();
    await expect(cashFlow).toHaveScreenshot('financial-statements-cash-flow.png', {
      animations: 'disabled',
    });
  });

  test('should match date range selector screenshot', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Screenshot the date range selector
    const dateSelector = page.locator('[data-testid="date-range"], .date-range, form').first();
    if (await dateSelector.count() > 0) {
      await expect(dateSelector).toHaveScreenshot('financial-statements-date-range.png', {
        animations: 'disabled',
      });
    }
  });

  test('should match export options screenshot', async ({ page }) => {
    // Try to open export options if they exist
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export"]').first();
    
    if (await exportButton.count() > 0) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      const exportMenu = page.locator('[data-testid="export-menu"], .export-menu, [role="menu"]').first();
      if (await exportMenu.count() > 0) {
        await expect(exportMenu).toHaveScreenshot('financial-statements-export-menu.png', {
          animations: 'disabled',
        });
      }
    }
  });
});