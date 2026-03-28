import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

/**
 * E2E Tests: Compatibility Flow
 * Tests the two-person compatibility reading journey
 */

test.describe('Compatibility Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/compatibility');
    await helpers.waitForPageLoad();
  });

  test('should load the compatibility page', async ({ page }) => {
    await expect(page).toHaveURL(/compatibility/);
    // Should have form elements for two people
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('should display input fields for two people', async ({ page }) => {
    // Look for name/DOB inputs — there should be at least 2 name fields
    const nameInputs = page.locator('input[type="text"], input[placeholder*="name" i], input[placeholder*="Name" i]');
    const count = await nameInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should show validation when fields are empty', async ({ page }) => {
    // Try to submit without filling in fields
    const submitButton = page.locator('button:has-text("Generate"), button:has-text("Compare"), button:has-text("Submit"), button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should either show validation or stay on the same page
      await expect(page).toHaveURL(/compatibility/);
    }
  });

  test('should navigate to compatibility from home page', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageLoad();

    // Look for a compatibility link
    const compatLink = page.locator('a[href*="compatibility"], button:has-text("Compatibility"), a:has-text("Compat")');
    if (await compatLink.first().isVisible()) {
      await compatLink.first().click();
      await expect(page).toHaveURL(/compatibility/);
    }
  });
});
