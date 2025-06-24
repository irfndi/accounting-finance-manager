import { Page, Locator, expect } from '@playwright/test';

/**
 * Base page class with common functionality
 * Implements DRY principle and provides reusable methods
 */
export abstract class BasePage {
  public page: Page;
  protected url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ timeout });
    return element;
  }

  async clickElement(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.click();
  }

  async fillInput(selector: string, value: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.fill(value);
  }

  async getText(selector: string): Promise<string> {
    const element = await this.waitForElement(selector);
    return await element.textContent() || '';
  }

  async isVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      await element.waitFor({ timeout: 5000 });
      return await element.isVisible();
    } catch {
      return false;
    }
  }

  async waitForNavigation(expectedUrl?: string): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    if (expectedUrl) {
      await expect(this.page).toHaveURL(expectedUrl);
    }
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async checkAccessibility(): Promise<void> {
    // Basic accessibility checks
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);

    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  }

  async checkPerformance(): Promise<void> {
    const navigationTiming = await this.page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        firstContentfulPaint: timing.domContentLoadedEventEnd - timing.fetchStart,
      };
    });

    // Performance thresholds
    expect(navigationTiming.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(navigationTiming.loadComplete).toBeLessThan(5000); // 5 seconds
  }

  async checkResponsiveDesign(): Promise<void> {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    
    // Check if mobile navigation exists or content adapts
    const isMobileResponsive = await this.page.evaluate(() => {
      return window.innerWidth <= 768;
    });
    expect(isMobileResponsive).toBe(true);

    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.waitForTimeout(500);

    // Test desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.waitForTimeout(500);
  }
}