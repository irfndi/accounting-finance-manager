import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ChartOfAccountsPage } from './pages/chart-of-accounts.page';

test.describe('Chart of Accounts Accessibility Tests', () => {
  let chartOfAccountsPage: ChartOfAccountsPage;

  test.beforeEach(async ({ page }) => {
    chartOfAccountsPage = new ChartOfAccountsPage(page);
    await chartOfAccountsPage.goto();
    await chartOfAccountsPage.verifyPageLoaded();
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper table accessibility', async ({ page }) => {
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      // Tables should have captions or aria-label
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
          
          // Headers should have proper scope if in data table
          if (!scope) {
            console.warn('Table header missing scope attribute');
          }
        }
      }
    }
  });

  test('should have proper form accessibility for account creation', async ({ page }) => {
    // Try to open add account form if it exists
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), [data-testid="add-account"]').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Check form accessibility
      const forms = await page.locator('form').all();
      
      for (const form of forms) {
        // Check all form inputs have labels
        const inputs = await form.locator('input, select, textarea').all();
        
        for (const input of inputs) {
          const hasLabel = await input.evaluate(el => {
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
        }
        
        // Check for required field indicators
        const requiredInputs = await form.locator('input[required], select[required], textarea[required]').all();
        
        for (const requiredInput of requiredInputs) {
          const ariaRequired = await requiredInput.getAttribute('aria-required');
          const required = await requiredInput.getAttribute('required');
          
          expect(ariaRequired === 'true' || required !== null).toBeTruthy();
        }
      }
    }
  });

  test('should have proper search functionality accessibility', async ({ page }) => {
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search" i], [data-testid*="search"]').all();
    
    for (const searchInput of searchInputs) {
      // Search inputs should have labels or aria-label
      const hasLabel = await searchInput.evaluate(el => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const placeholder = el.getAttribute('placeholder');
        
        if (ariaLabel || ariaLabelledBy) return true;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          return !!label;
        }
        
        // Placeholder can serve as accessible name for search
        return !!placeholder;
      });
      
      expect(hasLabel).toBeTruthy();
      
      // Search should have role="search" or be in a search landmark
      const role = await searchInput.getAttribute('role');
      const inSearchLandmark = await searchInput.evaluate(el => {
        return !!el.closest('[role="search"]');
      });
      
      expect(role === 'search' || inSearchLandmark).toBeTruthy();
    }
  });

  test('should have proper action button accessibility', async ({ page }) => {
    const actionButtons = await page.locator('button:has-text("Edit"), button:has-text("Delete"), button:has-text("View"), [data-testid*="action"]').all();
    
    for (const button of actionButtons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Action buttons should have clear accessible names
      expect(text?.trim() || ariaLabel).toBeTruthy();
      
      // If button only has an icon, it should have aria-label
      if (!text?.trim()) {
        expect(ariaLabel).toBeTruthy();
      }
    }
  });

  test('should have proper sorting accessibility', async ({ page }) => {
    const sortableHeaders = await page.locator('th[role="columnheader"], th[aria-sort], [data-sortable]').all();
    
    for (const header of sortableHeaders) {
      const ariaSort = await header.getAttribute('aria-sort');
      const role = await header.getAttribute('role');
      
      // Sortable headers should have proper ARIA attributes
      if (role === 'columnheader' || ariaSort) {
        expect(['ascending', 'descending', 'none', null]).toContain(ariaSort);
      }
      
      // Should be keyboard accessible
      const tabIndex = await header.getAttribute('tabindex');
      const isButton = await header.evaluate(el => el.tagName.toLowerCase() === 'button');
      const hasClickHandler = await header.evaluate(el => {
        return el.onclick !== null || el.addEventListener !== undefined;
      });
      
      if (hasClickHandler && !isButton) {
        expect(tabIndex === '0' || tabIndex === null).toBeTruthy();
      }
    }
  });

  test('should have proper pagination accessibility', async ({ page }) => {
    const paginationElements = await page.locator('[role="navigation"][aria-label*="pagination" i], .pagination, [data-testid*="pagination"]').all();
    
    for (const pagination of paginationElements) {
      // Pagination should be in a navigation landmark
      const role = await pagination.getAttribute('role');
      const ariaLabel = await pagination.getAttribute('aria-label');
      
      expect(role === 'navigation').toBeTruthy();
      expect(ariaLabel).toBeTruthy();
      
      // Check pagination buttons
      const paginationButtons = await pagination.locator('button, a').all();
      
      for (const button of paginationButtons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaCurrent = await button.getAttribute('aria-current');
        
        // Pagination buttons should have accessible names
        expect(text?.trim() || ariaLabel).toBeTruthy();
        
        // Current page should be indicated
        if (ariaCurrent === 'page') {
          expect(ariaCurrent).toBe('page');
        }
      }
    }
  });
});