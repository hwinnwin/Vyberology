import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly readingForm: Locator;
  readonly timeInput: Locator;
  readonly manualInput: Locator;
  readonly generateButton: Locator;
  readonly readingResult: Locator;

  constructor(page: Page) {
    this.page = page;
    this.readingForm = page.locator('[data-testid="reading-form"]');
    this.timeInput = page.locator('input[name="time"]');
    this.manualInput = page.locator('input[name="manual"]');
    this.generateButton = page.locator('button:has-text("Generate")');
    this.readingResult = page.locator('[data-testid="reading-result"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async generateTimeReading(time: string) {
    await this.timeInput.fill(time);
    await this.generateButton.click();
    await this.readingResult.waitFor({ state: 'visible', timeout: 10000 });
  }

  async generateManualReading(numbers: string) {
    await this.manualInput.fill(numbers);
    await this.generateButton.click();
    await this.readingResult.waitFor({ state: 'visible', timeout: 10000 });
  }
}
