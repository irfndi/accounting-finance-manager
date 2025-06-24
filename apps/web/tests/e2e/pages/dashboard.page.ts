import { BasePage } from './base.page';
import { Page, Locator, expect } from '@playwright/test';

/**
 * Dashboard page object model
 * Handles main dashboard functionality and navigation
 */
export class DashboardPage extends BasePage {
  private readonly navigation: Locator;
  private readonly mainContent: Locator;
  private readonly financeDashboard: Locator;
  private readonly quickActions: Locator;

  constructor(page: Page) {
    super(page, '/');
    this.navigation = page.locator('nav');
    this.mainContent = page.locator('main');
    this.financeDashboard = page.locator('[data-testid="finance-dashboard"]');
    this.quickActions = page.locator('[data-testid="quick-actions"]');
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/Finance Manager/);
    await expect(this.mainContent).toBeVisible();
  }

  async verifyNavigationExists(): Promise<void> {
    await expect(this.navigation).toBeVisible();
    
    // Check for main navigation links
    const navLinks = [
      { text: 'Dashboard', href: '/' },
      { text: 'Chart of Accounts', href: '/chart-of-accounts' },
      { text: 'General Ledger', href: '/general-ledger' },
      { text: 'Financial Statements', href: '/financial-statements' },
      { text: 'Reports', href: '/reports' },
      { text: 'Search', href: '/search' }
    ];

    for (const link of navLinks) {
      const navLink = this.page.locator(`nav a[href="${link.href}"]`);
      await expect(navLink).toBeVisible();
    }
  }

  async navigateToPage(path: string): Promise<void> {
    const navLink = this.page.locator(`nav a[href="${path}"]`);
    await navLink.click();
    await this.waitForNavigation();
  }

  async verifyDashboardContent(): Promise<void> {
    // Check if dashboard components are present
    const dashboardElements = [
      'h1, h2', // Main heading
      '[data-testid="finance-dashboard"], .dashboard', // Dashboard container
    ];

    for (const selector of dashboardElements) {
      const element = this.page.locator(selector).first();
      await expect(element).toBeVisible({ timeout: 10000 });
    }
  }

  async checkResponsiveDesign(): Promise<void> {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.verifyPageLoaded();
    
    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.verifyPageLoaded();
    
    // Test desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.verifyPageLoaded();
  }

  async verifyPerformanceMetrics(): Promise<void> {
    await this.checkPerformance();
    
    // Additional performance checks specific to dashboard
    const resourceTiming = await this.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources.map(resource => ({
        name: resource.name,
        duration: resource.duration,
        size: (resource as any).transferSize || 0
      }));
    });

    // Check that no single resource takes too long
    const slowResources = resourceTiming.filter(r => r.duration > 2000);
    expect(slowResources.length).toBeLessThanOrEqual(2); // Allow max 2 slow resources
  }
}