import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { TestHelpers, TestData } from './helpers';

/**
 * E2E Tests: Reading Generation Flow
 * Tests the core user journey of generating Vyberology readings
 */

test.describe('Reading Generation Flow', () => {
  let homePage: HomePage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    helpers = new TestHelpers(page);
    
    // Clear storage before each test
    await helpers.clearStorage();
    
    // Navigate to home page
    await homePage.goto();
    await helpers.waitForPageLoad();
  });

  test('should display the reading generation form', async ({ page }) => {
    // Verify form elements are present
    await expect(homePage.readingForm).toBeVisible();
    await expect(homePage.timeInput).toBeVisible();
    await expect(homePage.manualInput).toBeVisible();
    await expect(homePage.generateButton).toBeVisible();
  });

  test('should generate reading from time input (11:11)', async ({ page }) => {
    // Enter time
    await homePage.timeInput.fill('11:11');
    
    // Wait for API call
    const responsePromise = helpers.waitForApiResponse('vybe-reading');
    
    // Click generate
    await homePage.generateButton.click();
    
    // Wait for response
    await responsePromise;
    
    // Verify reading appears
    await expect(homePage.readingResult).toBeVisible({ timeout: 15000 });
    
    // Verify reading contains expected content
    const readingText = await homePage.readingResult.textContent();
    expect(readingText).toBeTruthy();
    expect(readingText!.length).toBeGreaterThan(50);
    
    // Take screenshot
    await helpers.screenshot('reading-time-11-11');
  });

  test('should generate reading from manual input (angel number 222)', async ({ page }) => {
    // Enter manual number
    await homePage.manualInput.fill('222');
    
    // Wait for API call
    const responsePromise = helpers.waitForApiResponse('vybe-reading');
    
    // Click generate
    await homePage.generateButton.click();
    
    // Wait for response
    await responsePromise;
    
    // Verify reading appears
    await expect(homePage.readingResult).toBeVisible({ timeout: 15000 });
    
    // Verify angel number mentioned
    const readingText = await homePage.readingResult.textContent();
    expect(readingText).toContain('222');
  });

  test('should handle different reading depths', async ({ page }) => {
    // Test lite depth
    await homePage.timeInput.fill('12:12');
    await page.selectOption('[name="depth"]', 'lite');
    await homePage.generateButton.click();
    
    await expect(homePage.readingResult).toBeVisible({ timeout: 15000 });
    
    const liteReading = await homePage.readingResult.textContent();
    const liteLength = liteReading!.length;
    
    // Clear and test deep depth
    await helpers.clearStorage();
    await homePage.goto();
    
    await homePage.timeInput.fill('12:12');
    await page.selectOption('[name="depth"]', 'deep');
    await homePage.generateButton.click();
    
    await expect(homePage.readingResult).toBeVisible({ timeout: 15000 });
    
    const deepReading = await homePage.readingResult.textContent();
    const deepLength = deepReading!.length;
    
    // Deep reading should be longer
    expect(deepLength).toBeGreaterThan(liteLength);
  });

  test('should save reading to history', async ({ page }) => {
    // Generate a reading
    await homePage.generateTimeReading('13:13');
    
    // Check localStorage
    const historyJson = await helpers.getLocalStorage('vyberology_reading_history');
    expect(historyJson).toBeTruthy();
    
    const history = JSON.parse(historyJson!);
    expect(history).toHaveLength(1);
    expect(history[0]).toHaveProperty('time', '13:13');
    expect(history[0]).toHaveProperty('reading');
  });

  test('should display error message for invalid input', async ({ page }) => {
    // Try to generate without input
    await homePage.generateButton.click();
    
    // Should show validation error
    await helpers.expectToast('Please enter a time or number');
  });

  test('should handle rate limiting gracefully', async ({ page }) => {
    // Rapid fire multiple requests
    for (let i = 0; i < 5; i++) {
      await homePage.timeInput.fill(`1${i}:${i}${i}`);
      await homePage.generateButton.click();
      await page.waitForTimeout(100);
    }
    
    // Should eventually show rate limit message
    const errorMessage = page.locator('text=/rate limit|too many requests/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate again after viewport change
    await homePage.goto();
    
    // Form should still be visible and functional
    await expect(homePage.readingForm).toBeVisible();
    await homePage.generateTimeReading('14:14');
    
    await expect(homePage.readingResult).toBeVisible({ timeout: 15000 });
    
    await helpers.screenshot('reading-mobile-viewport');
  });

  test('should persist reading after page reload', async ({ page }) => {
    // Generate reading
    await homePage.generateTimeReading('15:15');
    
    // Reload page
    await page.reload();
    await helpers.waitForPageLoad();
    
    // Reading should still be visible (from localStorage)
    const historyJson = await helpers.getLocalStorage('vyberology_reading_history');
    const history = JSON.parse(historyJson!);
    
    expect(history).toHaveLength(1);
    expect(history[0].time).toBe('15:15');
  });
});
