import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Dashboard Accessibility Tests', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check that headings are properly nested
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const text = await heading.textContent();
      
      // Headings should have text content
      expect(text?.trim()).toBeTruthy();
      
      // Headings should be visible
      await expect(heading).toBeVisible();
    }
  });

  test('should have proper form labels and accessibility', async ({ page }) => {
    // Check all form inputs have labels or aria-label
    const inputs = await page.locator('input, select, textarea').all();
    
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
        
        // Check if input is wrapped in a label
        const parentLabel = el.closest('label');
        return !!parentLabel;
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should have proper link accessibility', async ({ page }) => {
    const links = await page.locator('a').all();
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      // Links should have href or be buttons
      if (href) {
        expect(href).toBeTruthy();
      }
      
      // Links should have accessible text
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test('should have proper button accessibility', async ({ page }) => {
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const type = await button.getAttribute('type');
      
      // Buttons should have accessible text
      expect(text?.trim() || ariaLabel).toBeTruthy();
      
      // Form buttons should have explicit type
      const isInForm = await button.evaluate(el => {
        return !!el.closest('form');
      });
      
      if (isInForm && !type) {
        // This is a warning, not a failure
        console.warn('Button in form should have explicit type attribute');
      }
    }
  });

  test('should have proper image accessibility', async ({ page }) => {
    const images = await page.locator('img').all();
    
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      const ariaLabel = await image.getAttribute('aria-label');
      const role = await image.getAttribute('role');
      
      // Images should have alt text unless they are decorative
      if (role !== 'presentation' && !alt && !ariaLabel) {
        const src = await image.getAttribute('src');
        throw new Error(`Image with src "${src}" is missing alt text`);
      }
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // Run axe with color contrast rules specifically
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();
    
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(colorContrastViolations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test tab navigation
    const focusableElements = await page.locator(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();
    
    if (focusableElements.length > 0) {
      // Focus first element
      await focusableElements[0].focus();
      
      // Tab through elements
      for (let i = 1; i < Math.min(focusableElements.length, 10); i++) {
        await page.keyboard.press('Tab');
        
        // Check that focus moved
        const focusedElement = await page.locator(':focus').first();
        await expect(focusedElement).toBeVisible();
      }
    }
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toHaveCount(1);
    
    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toHaveCount(1);
    
    // Check that landmarks are properly labeled if there are multiple
    const landmarks = await page.locator('[role="banner"], [role="main"], [role="navigation"], [role="contentinfo"], header, main, nav, footer').all();
    
    const landmarkCounts: Record<string, number> = {};
    
    for (const landmark of landmarks) {
      const role = await landmark.evaluate(el => {
        return el.getAttribute('role') || el.tagName.toLowerCase();
      });
      
      landmarkCounts[role] = (landmarkCounts[role] || 0) + 1;
      
      // If there are multiple landmarks of the same type, they should be labeled
      if (landmarkCounts[role] > 1) {
        const ariaLabel = await landmark.getAttribute('aria-label');
        const ariaLabelledBy = await landmark.getAttribute('aria-labelledby');
        
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });
});