import { Page, expect, Locator } from '@playwright/test';

/**
 * Common utilities for E2E tests
 */
export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for an element to be visible and stable
   */
  async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    await element.waitFor({ state: 'attached', timeout });
    return element;
  }

  /**
   * Fill input with proper waiting and validation
   */
  async fillInput(selector: string, value: string): Promise<void> {
    const input = await this.waitForElement(selector);
    await input.clear();
    await input.fill(value);
    
    // Verify the value was set correctly
    const actualValue = await input.inputValue();
    expect(actualValue).toBe(value);
  }

  /**
   * Click element with proper waiting
   */
  async clickElement(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.click();
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string): Promise<void> {
    const select = await this.waitForElement(selector);
    await select.selectOption(value);
    
    // Verify selection
    const selectedValue = await select.inputValue();
    expect(selectedValue).toBe(value);
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(expectedUrl?: string): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    
    if (expectedUrl) {
      await this.page.waitForURL(expectedUrl);
    }
  }

  /**
   * Check if element exists without throwing
   */
  async elementExists(selector: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get text content from element
   */
  async getTextContent(selector: string): Promise<string> {
    const element = await this.waitForElement(selector);
    const text = await element.textContent();
    return text?.trim() || '';
  }

  /**
   * Get all text contents from multiple elements
   */
  async getAllTextContents(selector: string): Promise<string[]> {
    const elements = this.page.locator(selector);
    const count = await elements.count();
    const texts: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const text = await elements.nth(i).textContent();
      texts.push(text?.trim() || '');
    }
    
    return texts;
  }

  /**
   * Wait for table to load with data
   */
  async waitForTableData(tableSelector: string, minRows = 1): Promise<void> {
    const table = await this.waitForElement(tableSelector);
    
    // Wait for table body to have at least minRows
    await this.page.waitForFunction(
      ({ tableSelector, minRows }) => {
        const table = document.querySelector(tableSelector);
        if (!table) return false;
        
        const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
        return rows.length >= minRows;
      },
      { tableSelector, minRows },
      { timeout: 10000 }
    );
  }

  /**
   * Verify table contains specific data
   */
  async verifyTableContains(tableSelector: string, searchText: string): Promise<boolean> {
    const table = await this.waitForElement(tableSelector);
    const tableText = await table.textContent();
    return tableText?.includes(searchText) || false;
  }

  /**
   * Take screenshot with custom name
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Verify page accessibility
   */
  async checkAccessibility(): Promise<void> {
    // Check for basic accessibility requirements
    const hasMainLandmark = await this.elementExists('main, [role="main"]');
    const hasHeadings = await this.elementExists('h1, h2, h3, h4, h5, h6');
    const hasSkipLink = await this.elementExists('a[href="#main"], .skip-link');
    
    // These are basic checks - in a real app you'd use axe-core
    expect(hasMainLandmark || hasHeadings).toBeTruthy();
  }

  /**
   * Verify responsive design
   */
  async checkResponsiveness(): Promise<void> {
    const viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];
    
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(500); // Allow layout to settle
      
      // Verify no horizontal scroll
      const hasHorizontalScroll = await this.page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBeFalsy();
    }
    
    // Reset to default viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /**
   * Measure page performance
   */
  async measurePerformance(): Promise<PerformanceMetrics> {
    const performanceEntries = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    return performanceEntries;
  }

  /**
   * Verify form validation
   */
  async verifyFormValidation(formSelector: string, requiredFields: string[]): Promise<void> {
    const form = await this.waitForElement(formSelector);
    
    // Try to submit empty form
    const submitButton = form.locator('button[type="submit"], input[type="submit"]');
    await submitButton.click();
    
    // Check for validation messages
    for (const field of requiredFields) {
      const fieldElement = form.locator(field);
      const isInvalid = await fieldElement.evaluate((el: HTMLInputElement) => {
        return !el.validity.valid || el.hasAttribute('aria-invalid');
      });
      
      expect(isInvalid).toBeTruthy();
    }
  }

  /**
   * Wait for API call to complete
   */
  async waitForApiCall(urlPattern: string | RegExp, timeout = 10000): Promise<void> {
    await this.page.waitForResponse(
      response => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout }
    );
  }

  /**
   * Mock API response
   */
  async mockApiResponse(urlPattern: string | RegExp, responseData: any, status = 200): Promise<void> {
    await this.page.route(urlPattern, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      });
    });
  }

  /**
   * Simulate network failure
   */
  async simulateNetworkFailure(urlPattern: string | RegExp): Promise<void> {
    await this.page.route(urlPattern, route => {
      route.abort('failed');
    });
  }

  /**
   * Clear all route mocks
   */
  async clearMocks(): Promise<void> {
    await this.page.unrouteAll();
  }

  /**
   * Generate random test data
   */
  generateTestData() {
    const timestamp = Date.now();
    return {
      accountName: `Test Account ${timestamp}`,
      accountCode: `${Math.floor(Math.random() * 9000) + 1000}`,
      transactionDescription: `Test Transaction ${timestamp}`,
      amount: Math.floor(Math.random() * 10000) + 100,
      email: `test${timestamp}@example.com`,
      reference: `REF-${timestamp}`
    };
  }

  /**
   * Verify no console errors
   */
  async verifyNoConsoleErrors(): Promise<void> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any async errors
    await this.page.waitForTimeout(1000);
    
    // Filter out known acceptable errors
    const filteredErrors = errors.filter(error => {
      return !error.includes('favicon.ico') && 
             !error.includes('404') &&
             !error.includes('net::ERR_');
    });
    
    expect(filteredErrors).toHaveLength(0);
  }
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

/**
 * Create test utils instance
 */
export function createTestUtils(page: Page): TestUtils {
  return new TestUtils(page);
}

/**
 * Common test data generators
 */
export const TestDataGenerators = {
  /**
   * Generate random account data
   */
  account: () => {
    const timestamp = Date.now();
    const types = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    return {
      name: `Test Account ${timestamp}`,
      code: `${Math.floor(Math.random() * 9000) + 1000}`,
      type: types[Math.floor(Math.random() * types.length)],
      description: `Test account created at ${new Date().toISOString()}`
    };
  },

  /**
   * Generate random transaction data
   */
  transaction: () => {
    const timestamp = Date.now();
    return {
      date: new Date().toISOString().split('T')[0],
      description: `Test Transaction ${timestamp}`,
      reference: `REF-${timestamp}`,
      amount: Math.floor(Math.random() * 10000) + 100
    };
  },

  /**
   * Generate date range
   */
  dateRange: () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }
};