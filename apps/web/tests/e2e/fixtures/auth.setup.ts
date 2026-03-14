import { test as setup } from '@playwright/test';

/**
 * Pre-seed localStorage with mock auth state for E2E tests.
 * This avoids needing a real Supabase session in CI.
 */
setup('seed localStorage', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('sb-auth-token', JSON.stringify({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_at: Date.now() / 1000 + 3600,
    }));
  });
  await page.context().storageState({ path: 'tests/e2e/fixtures/.auth-state.json' });
});
