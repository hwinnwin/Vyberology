# E2E Tests with Playwright

End-to-end tests for Vyberology using Playwright Test framework.

## Setup

```bash
# Install dependencies (already done in package.json)
pnpm install

# Install Playwright browsers
pnpm exec playwright install chromium
```

## Running Tests

```bash
# Run all E2E tests (headless)
pnpm e2e

# Run with UI mode (interactive)
pnpm e2e:ui

# Run in headed mode (see browser)
pnpm e2e:headed

# Debug mode (step through tests)
pnpm e2e:debug

# View test report
pnpm e2e:report
```

## Test Structure

```
tests/e2e/
├── README.md              # This file
├── helpers.ts             # Test utilities and helpers
├── pages/                 # Page Object Models
│   └── HomePage.ts        # Home page interactions
├── auth-flow.spec.ts      # Authentication tests (9 tests)
└── reading-generation.spec.ts  # Reading generation tests (9 tests)
```

## Test Coverage

### Authentication Flow (9 tests)
- Display login form
- Validation errors for invalid credentials
- Handle login with invalid credentials gracefully
- Display signup form
- Validate password requirements on signup
- Validate password confirmation match
- Navigate between login and signup
- Display forgot password link
- Handle session persistence

### Reading Generation Flow (9 tests)
- Display the reading generation form
- Generate reading from time input (11:11)
- Generate reading from manual input (angel number 222)
- Handle different reading depths
- Save reading to history
- Display error message for invalid input
- Handle rate limiting gracefully
- Work on mobile viewport
- Persist reading after page reload

## Page Objects

Page objects encapsulate page-specific logic and selectors:

```typescript
// Example usage
import { HomePage } from './pages/HomePage';

const homePage = new HomePage(page);
await homePage.goto();
await homePage.generateTimeReading('11:11');
```

## Test Helpers

Common utilities for all tests:

```typescript
import { TestHelpers, TestData } from './helpers';

const helpers = new TestHelpers(page);
await helpers.waitForPageLoad();
await helpers.screenshot('test-name');
await helpers.expectToast('Success message');

// Test data generators
const email = TestData.randomEmail();
const password = TestData.testPassword();
const time = TestData.randomTime();
```

## CI Integration

E2E tests run automatically in CI when:
- Pull requests are opened
- Commits are pushed to main
- Manual workflow dispatch

CI configuration:
- Runs in headless mode
- Retries failed tests 2x
- Generates HTML report
- Captures screenshots on failure
- Records video on failure

## Environment Variables

```bash
# Base URL for tests (defaults to localhost:5173)
E2E_BASE_URL=https://staging.vyberology.app pnpm e2e
```

## Writing New Tests

1. Create a new `.spec.ts` file in `tests/e2e/`
2. Import test utilities and page objects
3. Use descriptive test names
4. Follow the AAA pattern (Arrange, Act, Assert)
5. Add screenshots for visual verification
6. Handle async operations with proper waits

Example:

```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { TestHelpers } from './helpers';

test.describe('My Feature', () => {
  let homePage: HomePage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    helpers = new TestHelpers(page);
    await homePage.goto();
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await homePage.timeInput.fill('12:12');
    
    // Act
    await homePage.generateButton.click();
    
    // Assert
    await expect(homePage.readingResult).toBeVisible();
    await helpers.screenshot('my-feature-test');
  });
});
```

## Debugging

### Failed Test Screenshots
Screenshots are automatically captured on test failure:
```
test-results/screenshots/
```

### Video Recordings
Videos are recorded for failed tests:
```
test-results/videos/
```

### Playwright Inspector
Debug tests step-by-step:
```bash
pnpm e2e:debug
```

### Trace Viewer
View detailed traces of test execution:
```bash
pnpm exec playwright show-trace trace.zip
```

## Best Practices

1. **Use Page Objects** - Encapsulate page logic
2. **Wait Appropriately** - Use `waitFor` methods, avoid hardcoded timeouts
3. **Descriptive Names** - Test names should describe behavior
4. **Independent Tests** - Each test should be runnable in isolation
5. **Clean State** - Clear storage/cookies before each test
6. **Screenshots** - Capture screenshots for visual verification
7. **Error Handling** - Test both success and failure paths
8. **Mobile Testing** - Test responsive design with different viewports

## Troubleshooting

### Tests fail locally but pass in CI
- Check if you have the correct Playwright browsers installed
- Verify your Node.js version matches CI
- Check for environment-specific issues

### Timeouts
- Increase timeout for slow operations
- Check network conditions
- Verify API responses

### Flaky tests
- Add proper waits for async operations
- Check for race conditions
- Verify element visibility before interaction

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
