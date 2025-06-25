import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { GeneralLedgerPage } from './pages/general-ledger.page';

test.describe('General Ledger Accessibility Tests', () => {
  let generalLedgerPage: GeneralLedgerPage;

  test.beforeEach(async ({ page }) => {
    generalLedgerPage = new GeneralLedgerPage(page);
    await generalLedgerPage.goto();
    await generalLedgerPage.verifyPageLoaded();
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ledger table accessibility', async ({ page }) => {
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
          
          // Headers should have proper scope for data tables
          if (!scope) {
            console.warn('Table header missing scope attribute');
          }
        }
      }
      
      // Check for proper row headers if applicable
      const rowHeaders = await table.locator('th[scope="row"]').all();
      const dataRows = await table.locator('tbody tr').all();
      
      if (dataRows.length > 0 && rowHeaders.length === 0) {
        // Complex tables should have row headers
        const columnCount = await table.locator('thead th, tbody tr:first-child td').count();
        if (columnCount > 3) {
          console.warn('Complex table may need row headers for better accessibility');
        }
      }
    }
  });

  test('should have proper filter form accessibility', async ({ page }) => {
    const filterForms = await page.locator('form, [data-testid="filters"]').all();
    
    for (const form of filterForms) {
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
      
      // Date inputs should have proper format information
      const dateInputs = await form.locator('input[type="date"], input[type="datetime-local"]').all();
      
      for (const dateInput of dateInputs) {
        const ariaDescribedBy = await dateInput.getAttribute('aria-describedby');
        const placeholder = await dateInput.getAttribute('placeholder');
        
        // Date inputs should have format guidance
        if (!ariaDescribedBy && !placeholder) {
          console.warn('Date input should have format guidance');
        }
      }
    }
  });

  test('should have proper entry form accessibility', async ({ page }) => {
    // Try to open add entry form if it exists
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), [data-testid="add-entry"]').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(500);
      
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
        
        // Check for error message accessibility
        const errorMessages = await form.locator('[role="alert"], .error, [data-testid*="error"]').all();
        
        for (const errorMessage of errorMessages) {
          const role = await errorMessage.getAttribute('role');
          const ariaLive = await errorMessage.getAttribute('aria-live');
          
          expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
        }
      }
    }
  });

  test('should have proper amount field accessibility', async ({ page }) => {
    const amountInputs = await page.locator('input[type="number"], input[name*="amount" i], [data-testid*="amount"]').all();
    
    for (const amountInput of amountInputs) {
      // Amount inputs should have proper labels
      const hasLabel = await amountInput.evaluate(el => {
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
      
      // Amount inputs should have proper input constraints
      const min = await amountInput.getAttribute('min');
      const max = await amountInput.getAttribute('max');
      const step = await amountInput.getAttribute('step');
      
      // Should have step for decimal amounts
      if (!step) {
        console.warn('Amount input should have step attribute for decimal precision');
      }
    }
  });

  test('should have proper account selection accessibility', async ({ page }) => {
    const accountSelects = await page.locator('select[name*="account" i], [data-testid*="account"]').all();
    
    for (const accountSelect of accountSelects) {
      // Account selects should have proper labels
      const hasLabel = await accountSelect.evaluate(el => {
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
      
      // Check option accessibility
      const options = await accountSelect.locator('option').all();
      
      for (const option of options) {
        const text = await option.textContent();
        const value = await option.getAttribute('value');
        
        // Options should have meaningful text
        expect(text?.trim()).toBeTruthy();
        
        // Options should have values
        if (text?.trim() !== 'Select...' && text?.trim() !== '') {
          expect(value).toBeTruthy();
        }
      }
    }
  });

  test('should have proper transaction type accessibility', async ({ page }) => {
    const transactionTypeInputs = await page.locator('input[type="radio"][name*="type" i], select[name*="type" i]').all();
    
    for (const input of transactionTypeInputs) {
      const inputType = await input.getAttribute('type');
      
      if (inputType === 'radio') {
        // Radio buttons should be in fieldsets with legends
        const fieldset = await input.evaluate(el => el.closest('fieldset'));
        
        if (fieldset) {
          const legend = await page.locator('fieldset legend').first();
          const legendText = await legend.textContent();
          expect(legendText?.trim()).toBeTruthy();
        } else {
          // If not in fieldset, should have proper labeling
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
      }
    }
  });
});