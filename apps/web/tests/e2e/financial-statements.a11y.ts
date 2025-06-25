import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { FinancialStatementsPage } from './pages/financial-statements.page';

test.describe('Financial Statements Accessibility Tests', () => {
  let financialStatementsPage: FinancialStatementsPage;

  test.beforeEach(async ({ page }) => {
    financialStatementsPage = new FinancialStatementsPage(page);
    await financialStatementsPage.goto();
    await financialStatementsPage.verifyPageLoaded();
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper tab navigation accessibility', async ({ page }) => {
    const tabs = await page.locator('[role="tab"], button[aria-selected]').all();
    
    if (tabs.length > 0) {
      for (const tab of tabs) {
        // Tabs should have proper ARIA attributes
        const ariaSelected = await tab.getAttribute('aria-selected');
        const ariaControls = await tab.getAttribute('aria-controls');
        const role = await tab.getAttribute('role');
        
        expect(role === 'tab').toBeTruthy();
        expect(['true', 'false']).toContain(ariaSelected);
        
        if (ariaControls) {
          // Controlled panel should exist
          const panel = page.locator(`#${ariaControls}`);
          await expect(panel).toHaveCount(1);
          
          // Panel should have proper role
          const panelRole = await panel.getAttribute('role');
          expect(panelRole === 'tabpanel').toBeTruthy();
        }
      }
      
      // Tab list should have proper role
      const tabList = page.locator('[role="tablist"]');
      await expect(tabList).toHaveCount(1);
      
      // Test keyboard navigation
      await tabs[0].focus();
      
      for (let i = 1; i < Math.min(tabs.length, 3); i++) {
        await page.keyboard.press('ArrowRight');
        
        // Check that focus moved
        const focusedElement = await page.locator(':focus').first();
        await expect(focusedElement).toBeVisible();
      }
    }
  });

  test('should have proper financial data table accessibility', async ({ page }) => {
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      // Financial tables should have captions
      const caption = await table.locator('caption').count();
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledBy = await table.getAttribute('aria-labelledby');
      
      expect(caption > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
      
      // Check for proper header structure
      const headers = await table.locator('th').all();
      if (headers.length > 0) {
        for (const header of headers) {
          const scope = await header.getAttribute('scope');
          const text = await header.textContent();
          
          // Headers should have text content
          expect(text?.trim()).toBeTruthy();
          
          // Financial tables should have proper scope
          if (!scope) {
            console.warn('Financial table header missing scope attribute');
          }
        }
      }
      
      // Check for proper number formatting accessibility
      const numberCells = await table.locator('td').all();
      
      for (const cell of numberCells) {
        const text = await cell.textContent();
        
        // Check if cell contains financial data (numbers with currency)
        if (text && /[\d,]+\.\d{2}/.test(text)) {
          // Financial numbers should be properly formatted
          const ariaLabel = await cell.getAttribute('aria-label');
          
          if (text.includes('(') || text.includes('-')) {
            // Negative numbers should have clear indication
            expect(ariaLabel || text.includes('negative') || text.includes('loss')).toBeTruthy();
          }
        }
      }
    }
  });

  test('should have proper date range form accessibility', async ({ page }) => {
    const dateInputs = await page.locator('input[type="date"], input[type="datetime-local"]').all();
    
    for (const dateInput of dateInputs) {
      // Date inputs should have proper labels
      const hasLabel = await dateInput.evaluate(el => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        
        if (ariaLabel || ariaLabelledBy) return true;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          return !!label;
        }
        
        const parentLabel = el.closest('label');
        return !!parentLabel;
      });
      
      expect(hasLabel).toBeTruthy();
      
      // Date inputs should have format information
      const ariaDescribedBy = await dateInput.getAttribute('aria-describedby');
      const placeholder = await dateInput.getAttribute('placeholder');
      
      if (!ariaDescribedBy && !placeholder) {
        console.warn('Date input should have format guidance');
      }
      
      // Date inputs should have proper constraints
      const min = await dateInput.getAttribute('min');
      const max = await dateInput.getAttribute('max');
      
      if (!min || !max) {
        console.warn('Date input should have min/max constraints for financial periods');
      }
    }
  });

  test('should have proper export functionality accessibility', async ({ page }) => {
    const exportButtons = await page.locator('button:has-text("Export"), button:has-text("Download")').all();
    
    for (const button of exportButtons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaExpanded = await button.getAttribute('aria-expanded');
      
      // Export buttons should have clear labels
      expect(text?.trim() || ariaLabel).toBeTruthy();
      
      // If button opens a menu, it should have aria-expanded
      if (ariaExpanded !== null) {
        expect(['true', 'false']).toContain(ariaExpanded);
        
        // Click to open menu and test accessibility
        await button.click();
        await page.waitForTimeout(300);
        
        const menu = page.locator('[role="menu"], [data-testid="export-menu"]').first();
        if (await menu.count() > 0) {
          // Menu should have proper role
          const menuRole = await menu.getAttribute('role');
          expect(menuRole === 'menu').toBeTruthy();
          
          // Menu items should have proper roles
          const menuItems = await menu.locator('[role="menuitem"], button, a').all();
          
          for (const item of menuItems) {
            const itemRole = await item.getAttribute('role');
            const itemText = await item.textContent();
            
            expect(itemRole === 'menuitem' || itemRole === null).toBeTruthy();
            expect(itemText?.trim()).toBeTruthy();
          }
        }
        
        // Close menu
        await page.keyboard.press('Escape');
      }
    }
  });

  test('should have proper financial summary accessibility', async ({ page }) => {
    const summaryElements = await page.locator('[data-testid*="summary"], .summary, .total').all();
    
    for (const summary of summaryElements) {
      // Summary sections should be properly labeled
      const ariaLabel = await summary.getAttribute('aria-label');
      const ariaLabelledBy = await summary.getAttribute('aria-labelledby');
      const heading = await summary.locator('h1, h2, h3, h4, h5, h6').first();
      
      const hasHeading = await heading.count() > 0;
      
      expect(ariaLabel || ariaLabelledBy || hasHeading).toBeTruthy();
      
      // Check for proper number announcements
      const numbers = await summary.locator(':text-matches("[\\d,]+\\.\\d{2}")').all();
      
      for (const number of numbers) {
        const text = await number.textContent();
        const ariaLabel = await number.getAttribute('aria-label');
        
        // Large financial numbers should have clear pronunciation
        if (text && parseFloat(text.replace(/[^\d.-]/g, '')) > 1000000) {
          if (!ariaLabel) {
            console.warn('Large financial numbers should have aria-label for clear pronunciation');
          }
        }
      }
    }
  });

  test('should have proper chart accessibility if present', async ({ page }) => {
    const charts = await page.locator('canvas, svg, [data-testid*="chart"]').all();
    
    for (const chart of charts) {
      const tagName = await chart.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'canvas' || tagName === 'svg') {
        // Charts should have alternative text or data table
        const ariaLabel = await chart.getAttribute('aria-label');
        const ariaLabelledBy = await chart.getAttribute('aria-labelledby');
        const ariaDescribedBy = await chart.getAttribute('aria-describedby');
        const role = await chart.getAttribute('role');
        
        expect(ariaLabel || ariaLabelledBy || ariaDescribedBy || role === 'img').toBeTruthy();
        
        // Check for alternative data table
        const parentSection = await chart.evaluate(el => el.closest('section, div'));
        if (parentSection) {
          const alternativeTable = page.locator('table').first();
          const tableCount = await alternativeTable.count();
          
          if (tableCount === 0) {
            console.warn('Chart should have alternative data table for accessibility');
          }
        }
      }
    }
  });

  test('should have proper status and loading state accessibility', async ({ page }) => {
    // Check for loading states
    const loadingElements = await page.locator('[aria-live], [role="status"], .loading').all();
    
    for (const loading of loadingElements) {
      const ariaLive = await loading.getAttribute('aria-live');
      const role = await loading.getAttribute('role');
      
      expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'status').toBeTruthy();
    }
    
    // Check for error states
    const errorElements = await page.locator('[role="alert"], .error').all();
    
    for (const error of errorElements) {
      const role = await error.getAttribute('role');
      const ariaLive = await error.getAttribute('aria-live');
      
      expect(role === 'alert' || ariaLive === 'assertive').toBeTruthy();
    }
  });
});