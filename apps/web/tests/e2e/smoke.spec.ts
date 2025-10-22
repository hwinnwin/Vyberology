import { test, expect } from '@playwright/test';

test('home loads without crashing', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Vyberology/i);
});
