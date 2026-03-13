import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers
 * Shared utilities for Playwright tests
 */

export class TestHelpers {
  constructor(public page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string, timeout = 5000) {
    await this.page.waitForSelector(selector, { 
      state: 'visible', 
      timeout 
    });
  }

  /**
   * Fill input and wait for it to be reflected
   */
  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
    await this.page.waitForTimeout(100); // Small delay for state updates
  }

  /**
   * Click and wait for navigation
   */
  async clickAndWaitForNavigation(selector: string) {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(selector)
    ]);
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp) {
    return await this.page.waitForResponse(
      response => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout: 10000 }
    );
  }

  /**
   * Check for toast/notification message
   */
  async expectToast(message: string) {
    const toast = this.page.locator('[role="status"], [role="alert"]', { 
      hasText: message 
    });
    await expect(toast).toBeVisible({ timeout: 5000 });
  }

  /**
   * Clear localStorage
   */
  async clearStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Set localStorage item
   */
  async setLocalStorage(key: string, value: string) {
    await this.page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      { key, value }
    );
  }

  /**
   * Get localStorage item
   */
  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate(
      (key) => localStorage.getItem(key),
      key
    );
  }
}

/**
 * Test data generators
 */
export const TestData = {
  /**
   * Generate random email
   */
  randomEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@vyberology.test`;
  },

  /**
   * Generate test password
   */
  testPassword(): string {
    return 'TestPassword123!';
  },

  /**
   * Generate random time reading
   */
  randomTime(): string {
    const times = ['11:11', '12:12', '13:13', '14:14', '15:15', '22:22'];
    return times[Math.floor(Math.random() * times.length)];
  },

  /**
   * Generate random angel number
   */
  randomAngelNumber(): string {
    const numbers = ['111', '222', '333', '444', '555', '666', '777', '888', '999'];
    return numbers[Math.floor(Math.random() * numbers.length)];
  },
};
