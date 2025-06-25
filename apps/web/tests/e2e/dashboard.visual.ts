import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Dashboard Visual Regression Tests', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();
  });

  test('should match dashboard desktop screenshot', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match dashboard mobile screenshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match dashboard tablet screenshot', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match navigation component screenshot', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Screenshot just the navigation
    const navigation = page.locator('nav');
    await expect(navigation).toHaveScreenshot('dashboard-navigation.png', {
      animations: 'disabled',
    });
  });

  test('should match main content area screenshot', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Screenshot just the main content
    const mainContent = page.locator('main');
    await expect(mainContent).toHaveScreenshot('dashboard-main-content.png', {
      animations: 'disabled',
    });
  });
});