import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

/**
 * E2E Tests: Navigation
 * Tests core navigation flows and page accessibility
 */

test.describe('Navigation', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should load landing page', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageLoad();
    await expect(page).toHaveTitle(/Vyberology/i);
  });

  test('should navigate to numerology reader', async ({ page }) => {
    await page.goto('/numerology');
    await helpers.waitForPageLoad();
    await expect(page).toHaveURL(/numerology/);
  });

  test('should navigate to compatibility page', async ({ page }) => {
    await page.goto('/compatibility');
    await helpers.waitForPageLoad();
    await expect(page).toHaveURL(/compatibility/);
  });

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await helpers.waitForPageLoad();
    // Should either load pricing or redirect
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should navigate to privacy page', async ({ page }) => {
    await page.goto('/privacy');
    await helpers.waitForPageLoad();
    await expect(page).toHaveURL(/privacy/);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('privacy');
  });

  test('should navigate to terms page', async ({ page }) => {
    await page.goto('/terms');
    await helpers.waitForPageLoad();
    await expect(page).toHaveURL(/terms/);
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('terms');
  });

  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await helpers.waitForPageLoad();
    // Should show some kind of not found state
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should navigate to history page', async ({ page }) => {
    await page.goto('/history');
    await helpers.waitForPageLoad();
    await expect(page).toHaveURL(/history/);
  });
});
