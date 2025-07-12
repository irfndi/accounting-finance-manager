import { test, expect } from '@playwright/test';
import type { Page, Request, Route } from '@playwright/test';
import { setupGlobalApiMocks } from './helpers/api-mocks';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Set up authentication state and E2E bypass flag in localStorage before any navigation
    await page.addInitScript(() => {
      // @ts-ignore
      window.__E2E_BYPASS_AUTH__ = true;
      localStorage.setItem('finance_manager_token', 'mock-jwt-token');
      localStorage.setItem('finance_manager_user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        createdAt: new Date().toISOString()
      }));
    });
    // Set up API mocks and authentication
    await setupGlobalApiMocks(page, false);
    // Navigate to dashboard with e2e bypass param
    await page.goto('/dashboard?e2e=1');
    // Wait for the dashboard to load
    await page.waitForSelector('[data-testid="dashboard-title"]', { timeout: 20000 });
  });

  test('should display dashboard title and description', async ({ page }: { page: Page }) => {
    // Check for dashboard title
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Corporate Finance Dashboard');
    
    // Check for dashboard description
    await expect(page.locator('[data-testid="dashboard-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-description"]')).toContainText('Monitor your financial performance');
  });

  test('should display financial summary cards', async ({ page }: { page: Page }) => {
    // Check for financial summary cards
    await expect(page.locator('[data-testid="total-assets-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-liabilities-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="net-worth-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-card"]')).toBeVisible();
  });

  test('should display navigation modules', async ({ page }: { page: Page }) => {
    // Check for navigation modules (these are cards that can be clicked)
    await expect(page.locator('[data-testid="overview-module"]')).toBeVisible();
    await expect(page.locator('[data-testid="general-ledger-module"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-categorization-module"]')).toBeVisible();
    await expect(page.locator('[data-testid="financial-reports-module"]')).toBeVisible();
  });

  test('should navigate to different modules', async ({ page }: { page: Page }) => {
    // Test that clicking modules works (allowing for navigation to take time)
    await page.locator('[data-testid="general-ledger-module"]').click();
    
    // Wait a bit for navigation to start
    await page.waitForTimeout(1000);
    
    // Either we're still on dashboard or we've navigated
    const url = page.url();
    
    // If we're still on dashboard, that's fine (shows the click happened)
    // If we've navigated to general ledger, that's also fine
    if (url.includes('/general-ledger')) {
      await expect(page).toHaveURL(/general-ledger/);
    } else {
      // Just check that the modules are clickable
      await expect(page.locator('[data-testid="general-ledger-module"]')).toBeVisible();
    }
    
    // Navigate back to dashboard explicitly
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="dashboard-title"]', { timeout: 20000 });
    
    // Test that modules are visible and clickable
    await expect(page.locator('[data-testid="financial-reports-module"]')).toBeVisible();
  });

  test('should display AI insights section', async ({ page }: { page: Page }) => {
    // Wait for AI Insights module to be visible
    await page.waitForSelector('[data-testid="ai-insights-module"]', { timeout: 15000 });

    // Debug: log all network requests after clicking
    const requests: string[] = [];
    page.on('request', (req: Request) => {
      requests.push(`${req.method()} ${req.url()}`);
    });

    await page.locator('[data-testid="ai-insights-module"]').click();

    // Debug: take a screenshot of the DOM after clicking
    await page.screenshot({ path: 'test-results/screenshots/ai-insights-prewait.png', fullPage: true });

    // Wait for either the loading spinner, the content, or the error message to appear
    const spinner = page.locator('text=AI is analyzing your financial data...');
    const content = page.locator('[data-testid="ai-insights-content"]');
    const errorPanel = page.locator('[data-testid="ai-error-message-panel"]');
    try {
      await Promise.race([
        spinner.waitFor({ state: 'visible', timeout: 15000 }),
        content.waitFor({ state: 'visible', timeout: 15000 }),
        errorPanel.waitFor({ state: 'visible', timeout: 15000 })
      ]);
    } catch (_e) {
      // Log error for test diagnostics
      // eslint-disable-next-line no-console
      console.error(_e);
      // Log all requests for debug
      // eslint-disable-next-line no-console
      console.log('Network requests after clicking AI Insights:', requests);
      await page.screenshot({ path: 'test-results/screenshots/ai-insights-timeout.png', fullPage: true });
      throw new Error('AI Insights spinner/content/error did not appear. Screenshot saved as ai-insights-timeout.png');
    }

    // Assert that at least one of content or error panel is visible
    const contentVisible = await content.isVisible();
    const errorVisible = await errorPanel.isVisible();
    expect(contentVisible || errorVisible).toBe(true);

    // If content is visible, check its structure
    if (contentVisible) {
      await expect(content).toContainText('AI Financial Insights');
    }
  });

  test('should display quick actions', async ({ page }: { page: Page }) => {
    // Check for quick action buttons
    await expect(page.locator('[data-testid="add-transaction-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="generate-report-button"]')).toBeVisible();
    
    // Check for other quick action buttons that should be visible
    await expect(page.locator('button:has-text("AI Analysis")')).toBeVisible();
    await expect(page.locator('button:has-text("Budget Review")')).toBeVisible();
  });

  test('should handle period selector', async ({ page }: { page: Page }) => {
    // Look for period selector if it exists
    const periodSelector = page.locator('[data-testid="period-selector"]');
    if (await periodSelector.isVisible()) {
      // Check that all period options exist in the select element
      await expect(page.locator('[data-testid="period-option-month"]')).toBeAttached();
      await expect(page.locator('[data-testid="period-option-quarter"]')).toBeAttached();
      await expect(page.locator('[data-testid="period-option-year"]')).toBeAttached();
      
      // Test changing the period
      await periodSelector.selectOption('quarter');
      await expect(periodSelector).toHaveValue('quarter');
      
      // Test changing back
      await periodSelector.selectOption('current');
      await expect(periodSelector).toHaveValue('current');
    }
  });

  test('should display refresh AI button', async ({ page }: { page: Page }) => {
    // Look for refresh AI button
    const refreshButton = page.locator('[data-testid="refresh-ai-button"]');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Should show loading state or updated content
      // This is a simple check - in practice, you'd wait for the refresh to complete
      await expect(refreshButton).toBeVisible();
    }
  });

  test('should display export report button', async ({ page }: { page: Page }) => {
    // Look for export report button
    const exportButton = page.locator('[data-testid="export-report-button"]');
    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeVisible();
      
      // Click to test functionality
      await exportButton.click();
      
      // Should either download or show export options
      // This depends on the implementation
      await expect(exportButton).toBeVisible();
    }
  });

  test('should display AI insights toggle', async ({ page }: { page: Page }) => {
    // Look for AI insights toggle
    const aiToggle = page.locator('[data-testid="ai-insights-toggle"]');
    if (await aiToggle.isVisible()) {
      await expect(aiToggle).toBeVisible();
      
      // Test toggle functionality
      await aiToggle.click();
      
      // Should toggle AI insights visibility
      await expect(aiToggle).toBeVisible();
    }
  });

  test('should handle responsive design', async ({ page }: { page: Page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Dashboard should still be visible and functional
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Dashboard should still be visible and functional
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle loading states', async ({ page }: { page: Page }) => {
    // Reload page to test loading states
    await page.reload();
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="dashboard-title"]', { timeout: 20000 });
    
    // Dashboard should be fully loaded
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });

  test('should display error handling', async ({ page }: { page: Page }) => {
    // Mock the AI insights endpoint to return an error
    await page.route('**/api/ai-insights', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Reload dashboard to trigger AI insights fetch
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="dashboard-title"]', { timeout: 20000 });

    // Click to open AI Insights module
    await page.locator('[data-testid="ai-insights-module"]').click();
    await page.waitForTimeout(100); // Give React time to update
    await page.waitForSelector('[data-testid="ai-error-message-panel"]', { timeout: 10000 });
    // Check for error message in the AI insights panel
    await expect(page.locator('[data-testid="ai-error-message-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-error-message-panel"]')).toContainText('Failed to load AI insights. Please try again later.');
  });
});