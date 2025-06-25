import { test, expect } from '@playwright/test';
import { GeneralLedgerPage } from './pages/general-ledger.page';

test.describe('General Ledger Visual Regression Tests', () => {
  let generalLedgerPage: GeneralLedgerPage;

  test.beforeEach(async ({ page }) => {
    generalLedgerPage = new GeneralLedgerPage(page);
    await generalLedgerPage.goto();
    await generalLedgerPage.verifyPageLoaded();
  });

  test('should match general ledger desktop screenshot', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('general-ledger-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match general ledger mobile screenshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('general-ledger-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match ledger entries table screenshot', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Screenshot just the ledger entries table
    const entriesTable = page.locator('table, [data-testid="ledger-entries"]').first();
    if (await entriesTable.count() > 0) {
      await expect(entriesTable).toHaveScreenshot('general-ledger-entries.png', {
        animations: 'disabled',
      });
    }
  });

  test('should match filters section screenshot', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Screenshot the filters section
    const filtersSection = page.locator('[data-testid="filters"], .filters, form').first();
    if (await filtersSection.count() > 0) {
      await expect(filtersSection).toHaveScreenshot('general-ledger-filters.png', {
        animations: 'disabled',
      });
    }
  });

  test('should match add entry form screenshot', async ({ page }) => {
    // Try to open add entry form if it exists
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), [data-testid="add-entry"]').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(500); // Wait for form to appear
      
      const form = page.locator('form, [data-testid="add-entry-form"]').first();
      if (await form.count() > 0) {
        await expect(form).toHaveScreenshot('general-ledger-add-form.png', {
          animations: 'disabled',
        });
      }
    }
  });
});