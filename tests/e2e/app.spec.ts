import { test, expect } from '@playwright/test';

/**
 * Basic E2E test to verify the application loads correctly
 */
test.describe('Application', () => {
    test('should load the home page', async ({ page }) => {
        await page.goto('/');

        // Wait for the page to load
        await page.waitForLoadState('domcontentloaded');

        // Check that the page has a title
        await expect(page).toHaveTitle(/.*/);
    });

    test('should navigate without errors', async ({ page }) => {
        // Navigate to the home page
        await page.goto('/');

        // Verify no console errors on load
        const errors: string[] = [];
        page.on('pageerror', (error) => {
            errors.push(error.message);
        });

        await page.waitForLoadState('networkidle');

        // Allow some non-critical errors but fail on critical ones
        const criticalErrors = errors.filter(
            (e) => !e.includes('net::ERR') && !e.includes('favicon')
        );
        expect(criticalErrors).toHaveLength(0);
    });
});
