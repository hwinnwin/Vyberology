import { test, expect } from '@playwright/test';
import { TestHelpers, TestData } from './helpers';

/**
 * E2E Tests: Authentication Flow
 * Tests user authentication journeys
 */

test.describe('Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.clearStorage();
    await page.goto('/');
    await helpers.waitForPageLoad();
  });

  test('should display login form', async ({ page }) => {
    // Click login/signup button
    await page.click('text=/sign in|login/i');
    
    // Verify login form appears
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button:has-text("Sign In")');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    // Navigate to login
    await page.click('text=/sign in|login/i');
    
    // Try to submit with empty fields
    await page.click('button:has-text("Sign In")');
    
    // Should show validation errors
    const errorMessage = page.locator('text=/required|invalid/i');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should handle login with invalid credentials gracefully', async ({ page }) => {
    // Navigate to login
    await page.click('text=/sign in|login/i');
    
    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit
    await page.click('button:has-text("Sign In")');
    
    // Wait for error response
    await page.waitForTimeout(2000);
    
    // Should show error message
    const errorMessage = page.locator('text=/invalid credentials|incorrect/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    await helpers.screenshot('auth-invalid-credentials');
  });

  test('should display signup form', async ({ page }) => {
    // Click signup link
    await page.click('text=/sign up|create account/i');
    
    // Verify signup form fields
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
  });

  test('should validate password requirements on signup', async ({ page }) => {
    // Navigate to signup
    await page.click('text=/sign up|create account/i');
    
    // Fill email
    await page.fill('input[type="email"]', TestData.randomEmail());
    
    // Try weak password
    await page.fill('input[type="password"]', '123');
    
    // Should show password requirements
    const requirement = page.locator('text=/at least|minimum|characters/i');
    await expect(requirement).toBeVisible({ timeout: 3000 });
  });

  test('should validate password confirmation match', async ({ page }) => {
    // Navigate to signup
    await page.click('text=/sign up|create account/i');
    
    // Fill form with mismatched passwords
    await page.fill('input[type="email"]', TestData.randomEmail());
    await page.fill('input[type="password"]', TestData.testPassword());
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    
    // Submit
    await page.click('button:has-text("Sign Up")');
    
    // Should show mismatch error
    const errorMessage = page.locator('text=/passwords do not match|must match/i');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should navigate between login and signup', async ({ page }) => {
    // Start at login
    await page.click('text=/sign in|login/i');
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    
    // Switch to signup
    await page.click('text=/sign up|create account/i');
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
    
    // Switch back to login
    await page.click('text=/sign in|login/i');
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should display forgot password link', async ({ page }) => {
    // Navigate to login
    await page.click('text=/sign in|login/i');
    
    // Verify forgot password link exists
    const forgotLink = page.locator('text=/forgot password|reset password/i');
    await expect(forgotLink).toBeVisible();
  });

  test('should handle session persistence', async ({ page }) => {
    // Simulate authenticated session by setting localStorage
    const mockSession = {
      access_token: 'mock-token',
      user: {
        id: 'test-user-id',
        email: 'test@vyberology.test'
      }
    };
    
    await helpers.setLocalStorage('supabase.auth.token', JSON.stringify(mockSession));
    
    // Reload page
    await page.reload();
    await helpers.waitForPageLoad();
    
    // Should show authenticated state (e.g., user menu, logout button)
    const userMenu = page.locator('[data-testid="user-menu"], text=/profile|logout/i');
    await expect(userMenu).toBeVisible({ timeout: 5000 });
  });
});
