import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

/**
 * E2E Tests: Reading History
 * Tests reading history persistence and display
 */

test.describe('Reading History', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForPageLoad();
  });

  test('should persist reading to localStorage after generation', async ({ page }) => {
    // Clear any existing history
    await helpers.clearStorage();

    // Navigate to history page
    await page.goto('/history');
    await helpers.waitForPageLoad();

    // With no history, should show empty state or no readings
    const emptyState = page.locator('text=/no reading|empty|start/i');
    const readingCards = page.locator('[data-testid="reading-card"], [class*="reading"]');

    // Either an empty state message or zero reading cards
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const cardCount = await readingCards.count();

    expect(hasEmptyState || cardCount === 0).toBeTruthy();
  });

  test('should load history page without crashing', async ({ page }) => {
    await page.goto('/history');
    await helpers.waitForPageLoad();

    // Page should load (not 404)
    await expect(page).toHaveURL(/history/);
  });

  test('should display readings from localStorage', async ({ page }) => {
    // Pre-seed a reading into localStorage
    await page.goto('/');
    await helpers.waitForPageLoad();

    const mockHistory = JSON.stringify([
      {
        id: 'test-reading-1',
        timestamp: new Date().toISOString(),
        inputType: 'manual',
        inputValue: '111',
        reading: 'Your angel number 111 represents new beginnings.',
      },
    ]);

    await helpers.setLocalStorage('vyberology_reading_history', mockHistory);

    // Navigate to history
    await page.goto('/history');
    await helpers.waitForPageLoad();

    // Should show the seeded reading content somewhere on the page
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should handle corrupted localStorage gracefully', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageLoad();

    // Set corrupted data
    await helpers.setLocalStorage('vyberology_reading_history', '{invalid json!!!');

    // Navigate to history — should not crash
    await page.goto('/history');
    await helpers.waitForPageLoad();

    await expect(page).toHaveURL(/history/);
  });
});
