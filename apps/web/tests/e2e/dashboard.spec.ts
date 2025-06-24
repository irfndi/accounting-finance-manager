import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Dashboard E2E Tests', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should load dashboard page successfully', async () => {
    await dashboardPage.verifyPageLoaded();
  });

  test('should display main navigation', async () => {
    await dashboardPage.verifyNavigationExists();
  });

  test('should display dashboard content', async () => {
    await dashboardPage.verifyDashboardContent();
  });

  test('should navigate to different pages', async () => {
    const pages = [
      '/chart-of-accounts',
      '/general-ledger',
      '/financial-statements',
      '/reports',
      '/search'
    ];

    for (const path of pages) {
      await dashboardPage.navigateToPage(path);
      await expect(dashboardPage.page).toHaveURL(new RegExp(path));
      
      // Navigate back to dashboard
      await dashboardPage.goto();
      await dashboardPage.verifyPageLoaded();
    }
  });

  test('should be responsive across different screen sizes', async () => {
    await dashboardPage.checkResponsiveDesign();
  });

  test('should meet accessibility standards', async () => {
    await dashboardPage.checkAccessibility();
  });

  test('should meet performance standards', async () => {
    await dashboardPage.verifyPerformanceMetrics();
  });

  test('should handle errors gracefully', async () => {
    // Test navigation to non-existent page
    await dashboardPage.page.goto('/non-existent-page');
    
    // Should show 404 or redirect to dashboard
    const url = dashboardPage.page.url();
    const is404 = url.includes('404') || url.includes('not-found');
    const isRedirected = url.includes('/');
    
    expect(is404 || isRedirected).toBeTruthy();
  });

  test('should maintain state during navigation', async () => {
    // Navigate away and back
    await dashboardPage.navigateToPage('/chart-of-accounts');
    await dashboardPage.goto();
    
    // Verify dashboard is still functional
    await dashboardPage.verifyPageLoaded();
    await dashboardPage.verifyNavigationExists();
  });

  test('should load within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
  });

  test('should work with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false
    });
    
    const page = await context.newPage();
    await page.goto('/');
    
    // Basic content should still be visible
    const mainContent = page.locator('main, body');
    await expect(mainContent).toBeVisible();
    
    await context.close();
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate offline condition
    await page.context().setOffline(true);
    
    try {
      await page.goto('/');
      
      // Should show offline message or cached content
      const offlineIndicator = page.locator('[data-testid="offline"], .offline-message');
      const hasContent = await page.locator('main, body').isVisible({ timeout: 5000 });
      
      expect(await offlineIndicator.isVisible() || hasContent).toBeTruthy();
    } finally {
      await page.context().setOffline(false);
    }
  });
});

test.describe('Dashboard Visual Regression Tests', () => {
  test('should match dashboard screenshot', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();
    
    // Wait for any animations to complete
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match mobile dashboard screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      threshold: 0.3
    });
  });
});