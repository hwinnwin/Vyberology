import { test, expect } from "@playwright/test";

test("loads the new tab experience", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("THE VYBER")).toBeVisible();
  await expect(page.getByPlaceholder("Search the web")).toBeVisible();
});

test("opens AI command palette and settings", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Control+Shift+K");
  await expect(page.getByText("Vyber AI")).toBeVisible();

  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+,");
  await expect(page.getByText("Settings")).toBeVisible();
});
