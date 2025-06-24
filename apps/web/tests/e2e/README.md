# E2E Testing Suite

Comprehensive end-to-end testing suite for the Finance Manager application using Playwright.

## Overview

This E2E testing suite provides comprehensive coverage for:
- **Core Functionality**: Dashboard, Chart of Accounts, General Ledger, Financial Statements
- **Integration Testing**: Cross-module workflows and data consistency
- **Accessibility Testing**: WCAG compliance and keyboard navigation
- **Visual Regression Testing**: UI consistency across browsers
- **Performance Testing**: Load times and responsiveness
- **Security Testing**: XSS prevention and input validation

## Test Structure

```
tests/e2e/
├── fixtures/
│   └── test-data.ts          # Centralized test data
├── pages/
│   ├── base.page.ts          # Base page object model
│   ├── dashboard.page.ts     # Dashboard page objects
│   ├── chart-of-accounts.page.ts
│   ├── general-ledger.page.ts
│   └── financial-statements.page.ts
├── utils/
│   └── test-utils.ts         # Common utilities and helpers
├── *.spec.ts                 # Test specifications
├── integration.spec.ts       # Cross-module integration tests
├── global-setup.ts          # Global setup and teardown
└── README.md                # This file
```

## Prerequisites

1. **Node.js** (v18 or higher)
2. **pnpm** package manager
3. **Playwright** browsers installed

## Installation

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install

# Install system dependencies (Linux only)
pnpm exec playwright install-deps
```

## Running Tests

### Local Development

```bash
# Start the application first
pnpm dev

# In another terminal, run E2E tests
pnpm test:e2e

# Run specific test file
pnpm exec playwright test dashboard.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test --headed

# Run tests in debug mode
pnpm exec playwright test --debug
```

### Production Testing

```bash
# Build and preview the application
pnpm build
pnpm preview

# Run E2E tests against production build
BASE_URL=http://localhost:4173 pnpm test:e2e
```

### CI/CD Pipeline

The tests are automatically run in GitHub Actions:
- On pull requests
- On pushes to main branch
- Uses production build for testing
- Generates test reports and artifacts

## Test Configuration

### Environment Variables

- `BASE_URL`: Application URL (default: http://localhost:3000 for dev, http://localhost:4321 for preview)
- `CI`: Set to true in CI environment
- `HEADLESS`: Run tests in headless mode (default: true)

### Browser Configuration

Tests run on multiple browsers:
- **Chromium** (Desktop)
- **Firefox** (Desktop)
- **WebKit** (Desktop)
- **Mobile Chrome** (Android simulation)
- **Mobile Safari** (iOS simulation)

## Writing Tests

### Page Object Model

Use the page object pattern for maintainable tests:

```typescript
import { DashboardPage } from './pages/dashboard.page';

test('should display dashboard', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goto();
  await dashboardPage.verifyPageLoaded();
  await dashboardPage.verifyDashboardContent();
});
```

### Test Utilities

Use common utilities for consistent testing:

```typescript
import { createTestUtils } from './utils/test-utils';

test('should handle form validation', async ({ page }) => {
  const utils = createTestUtils(page);
  await utils.fillInput('[data-testid="account-name"]', 'Test Account');
  await utils.verifyFormValidation('form', ['input[required]']);
});
```

### Test Data

Use centralized test data:

```typescript
import { testData } from './fixtures/test-data';

test('should create account', async ({ page }) => {
  const { sample } = testData.accounts;
  // Use sample.name, sample.code, etc.
});
```

## Best Practices

### 1. Test Independence
- Each test should be independent
- Use unique test data to avoid conflicts
- Clean up after tests when necessary

### 2. Reliable Selectors
- Prefer `data-testid` attributes
- Use semantic selectors when possible
- Avoid brittle CSS selectors

```typescript
// Good
page.locator('[data-testid="add-account-button"]')
page.locator('button:has-text("Add Account")')

// Avoid
page.locator('.btn.btn-primary.mt-3')
```

### 3. Waiting Strategies
- Use explicit waits for dynamic content
- Wait for network requests to complete
- Use `waitForLoadState('networkidle')` for SPA navigation

```typescript
// Wait for element
await page.locator('[data-testid="table"]').waitFor();

// Wait for navigation
await page.waitForLoadState('networkidle');

// Wait for API call
await page.waitForResponse('**/api/accounts');
```

### 4. Error Handling
- Use try-catch for optional elements
- Provide meaningful error messages
- Take screenshots on failures

### 5. Performance
- Keep tests focused and fast
- Use parallel execution
- Mock external dependencies when appropriate

## Debugging Tests

### Visual Debugging

```bash
# Run in headed mode
pnpm exec playwright test --headed

# Run with slow motion
pnpm exec playwright test --headed --slowMo=1000

# Debug specific test
pnpm exec playwright test dashboard.spec.ts --debug
```

### Test Reports

```bash
# Generate HTML report
pnpm exec playwright show-report

# View test results
open playwright-report/index.html
```

### Screenshots and Videos

- Screenshots are taken on test failures
- Videos are recorded for failed tests
- Traces are collected for debugging

Files are saved in `test-results/` directory.

## Accessibility Testing

Tests include basic accessibility checks:
- Semantic HTML structure
- Keyboard navigation
- ARIA attributes
- Color contrast (manual verification)

For comprehensive accessibility testing, consider integrating:
- `@axe-core/playwright`
- `playwright-lighthouse`

## Visual Regression Testing

Visual tests compare screenshots:

```typescript
test('should match dashboard design', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

Update screenshots:
```bash
pnpm exec playwright test --update-snapshots
```

## Performance Testing

Basic performance metrics are collected:
- Page load times
- First contentful paint
- Network requests

For detailed performance testing, consider:
- Lighthouse CI
- Web Vitals monitoring
- Load testing tools

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in config
   - Check for slow network requests
   - Verify application is running

2. **Element not found**
   - Check selector specificity
   - Wait for element to be visible
   - Verify application state

3. **Flaky tests**
   - Add proper waits
   - Use stable selectors
   - Check for race conditions

4. **Browser launch failures**
   - Reinstall browsers: `pnpm exec playwright install`
   - Check system dependencies
   - Verify permissions

### Getting Help

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Discord](https://discord.gg/playwright)
- [GitHub Issues](https://github.com/microsoft/playwright/issues)

## Maintenance

### Regular Tasks

1. **Update test data** when application changes
2. **Review and update selectors** for UI changes
3. **Update screenshots** for visual regression tests
4. **Monitor test performance** and optimize slow tests
5. **Update Playwright** regularly for latest features

### Code Quality

- Follow TypeScript best practices
- Use ESLint and Prettier for consistency
- Write descriptive test names
- Add comments for complex test logic
- Keep page objects focused and reusable

## Contributing

When adding new tests:

1. Follow the existing patterns
2. Use page object model
3. Add appropriate test data
4. Include accessibility checks
5. Test across multiple browsers
6. Update documentation

## Test Coverage

Current test coverage includes:

- ✅ Dashboard functionality
- ✅ Chart of Accounts CRUD operations
- ✅ General Ledger transactions
- ✅ Financial Statements generation
- ✅ Cross-module integration
- ✅ Accessibility compliance
- ✅ Visual regression
- ✅ Performance metrics
- ✅ Security validation
- ✅ Error handling
- ✅ Responsive design

## Future Enhancements

- [ ] API testing integration
- [ ] Database state verification
- [ ] Advanced performance monitoring
- [ ] Comprehensive accessibility audits
- [ ] Multi-user concurrent testing
- [ ] Internationalization testing
- [ ] Print functionality testing
- [ ] File upload/download testing