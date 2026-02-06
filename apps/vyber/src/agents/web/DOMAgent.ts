/**
 * THE VYBER - DOM Agent
 * Agent for interacting with web page DOM elements
 */

import {
  BaseAgent,
  defineAgent,
  defineCapability,
  AgentRegistry,
} from '../core/AgentRegistry';
import type { Task, ExtractedData, AgentConfig } from '../types';

// Capabilities
const CLICK_CAPABILITY = defineCapability(
  'dom.click',
  'Click Elements',
  'Click on DOM elements using CSS selectors',
  ['dom.interact']
);

const TYPE_CAPABILITY = defineCapability(
  'dom.type',
  'Type Text',
  'Type text into input fields',
  ['dom.interact']
);

const EXTRACT_CAPABILITY = defineCapability(
  'dom.extract',
  'Extract Content',
  'Extract text, HTML, or attributes from elements',
  ['dom.read']
);

const SCROLL_CAPABILITY = defineCapability(
  'dom.scroll',
  'Scroll Page',
  'Scroll to elements or positions on the page',
  ['dom.interact']
);

const WAIT_CAPABILITY = defineCapability(
  'dom.wait',
  'Wait for Elements',
  'Wait for elements to appear or conditions to be met',
  ['dom.read']
);

const SCREENSHOT_CAPABILITY = defineCapability(
  'dom.screenshot',
  'Capture Screenshot',
  'Capture screenshots of the page or elements',
  ['dom.read']
);

// Agent metadata
const DOM_AGENT_METADATA = defineAgent(
  'dom-agent',
  'DOM Agent',
  'Interacts with web page DOM elements - clicking, typing, extracting content, and more',
  [
    CLICK_CAPABILITY,
    TYPE_CAPABILITY,
    EXTRACT_CAPABILITY,
    SCROLL_CAPABILITY,
    WAIT_CAPABILITY,
    SCREENSHOT_CAPABILITY,
  ],
  {
    maxConcurrentTasks: 1,
    defaultTimeout: 30000,
  }
);

// Task payload types
interface ClickPayload {
  selector: string;
  options?: {
    scrollIntoView?: boolean;
    delay?: number;
    button?: 'left' | 'right' | 'middle';
  };
}

interface TypePayload {
  selector: string;
  text: string;
  options?: {
    clearFirst?: boolean;
    delay?: number;
    pressEnter?: boolean;
  };
}

interface ExtractPayload {
  selector: string;
  type: 'text' | 'html' | 'attribute' | 'value' | 'list';
  attribute?: string;
  multiple?: boolean;
}

interface ScrollPayload {
  selector?: string;
  position?: { x: number; y: number };
  behavior?: 'smooth' | 'instant';
}

interface WaitPayload {
  selector?: string;
  condition?: 'visible' | 'hidden' | 'exists' | 'removed';
  timeout?: number;
  text?: string;
}

interface ScreenshotPayload {
  selector?: string;
  fullPage?: boolean;
}

/**
 * DOMAgent - Interacts with web page DOM
 *
 * Supports:
 * - Clicking elements
 * - Typing into inputs
 * - Extracting content
 * - Scrolling
 * - Waiting for elements/conditions
 * - Taking screenshots
 */
export class DOMAgent extends BaseAgent {
  private iframeRef: HTMLIFrameElement | null = null;

  constructor(config?: Partial<AgentConfig>) {
    super({
      ...DOM_AGENT_METADATA,
      config: { ...DOM_AGENT_METADATA.config, ...config },
    });
  }

  setIframeRef(ref: HTMLIFrameElement | null): void {
    this.iframeRef = ref;
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'DOMAgent initialized');
  }

  protected async onExecute(task: Task): Promise<unknown> {
    const actionType = task.type.replace('dom.', '');
    const payload = task.payload as Record<string, unknown>;

    switch (actionType) {
      case 'click':
        return this.handleClick(payload as unknown as ClickPayload);
      case 'type':
        return this.handleType(payload as unknown as TypePayload);
      case 'extract':
        return this.handleExtract(payload as unknown as ExtractPayload);
      case 'scroll':
        return this.handleScroll(payload as unknown as ScrollPayload);
      case 'wait':
        return this.handleWait(payload as unknown as WaitPayload);
      case 'screenshot':
        return this.handleScreenshot(payload as unknown as ScreenshotPayload);
      default:
        throw new Error(`Unknown DOM action: ${actionType}`);
    }
  }

  // Get the document to work with (iframe or main window)
  private getDocument(): Document {
    if (this.iframeRef?.contentDocument) {
      return this.iframeRef.contentDocument;
    }
    return document;
  }

  // Get element by selector
  private getElement(selector: string): Element | null {
    try {
      return this.getDocument().querySelector(selector);
    } catch (error) {
      this.log('error', `Invalid selector: ${selector}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  // Get multiple elements
  private getElements(selector: string): Element[] {
    try {
      return Array.from(this.getDocument().querySelectorAll(selector));
    } catch (error) {
      this.log('error', `Invalid selector: ${selector}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  // Wait for element to appear
  private waitForElement(
    selector: string,
    timeout: number = 10000,
    condition: 'visible' | 'hidden' | 'exists' | 'removed' = 'exists'
  ): Promise<Element | null> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        const element = this.getElement(selector);
        const elapsed = Date.now() - startTime;

        if (elapsed > timeout) {
          reject(new Error(`Timeout waiting for element: ${selector}`));
          return;
        }

        switch (condition) {
          case 'exists':
            if (element) {
              resolve(element);
              return;
            }
            break;
          case 'removed':
            if (!element) {
              resolve(null);
              return;
            }
            break;
          case 'visible':
            if (element) {
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              if (
                rect.width > 0 &&
                rect.height > 0 &&
                style.visibility !== 'hidden' &&
                style.display !== 'none'
              ) {
                resolve(element);
                return;
              }
            }
            break;
          case 'hidden':
            if (!element) {
              resolve(null);
              return;
            }
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            if (
              rect.width === 0 ||
              rect.height === 0 ||
              style.visibility === 'hidden' ||
              style.display === 'none'
            ) {
              resolve(element);
              return;
            }
            break;
        }

        requestAnimationFrame(check);
      };

      check();
    });
  }

  // Handle click action
  private async handleClick(payload: ClickPayload): Promise<{ clicked: boolean }> {
    this.log('info', `Clicking element: ${payload.selector}`);
    this.setProgress(10);

    const element = this.getElement(payload.selector);
    if (!element) {
      throw new Error(`Element not found: ${payload.selector}`);
    }

    this.setProgress(30);

    // Scroll into view if needed
    if (payload.options?.scrollIntoView !== false) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    this.setProgress(60);

    // Delay if specified
    if (payload.options?.delay) {
      await new Promise(resolve => setTimeout(resolve, payload.options!.delay));
    }

    // Click the element
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      button: payload.options?.button === 'right' ? 2 : payload.options?.button === 'middle' ? 1 : 0,
    });

    element.dispatchEvent(clickEvent);

    // Also try the native click for buttons/links
    if (element instanceof HTMLElement) {
      element.click();
    }

    this.setProgress(100);
    this.log('info', `Clicked element: ${payload.selector}`);

    return { clicked: true };
  }

  // Handle type action
  private async handleType(payload: TypePayload): Promise<{ typed: boolean; text: string }> {
    this.log('info', `Typing into element: ${payload.selector}`);
    this.setProgress(10);

    const element = this.getElement(payload.selector);
    if (!element) {
      throw new Error(`Element not found: ${payload.selector}`);
    }

    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      throw new Error(`Element is not an input or textarea: ${payload.selector}`);
    }

    this.setProgress(30);

    // Focus the element
    element.focus();

    // Clear if requested
    if (payload.options?.clearFirst) {
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    this.setProgress(50);

    // Type with delay if specified
    const delay = payload.options?.delay || 0;
    if (delay > 0) {
      for (const char of payload.text) {
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } else {
      element.value += payload.text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    this.setProgress(80);

    // Press enter if requested
    if (payload.options?.pressEnter) {
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
      });
      element.dispatchEvent(enterEvent);

      // Also submit the form if there is one
      const form = element.closest('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true }));
      }
    }

    this.setProgress(100);
    this.log('info', `Typed text into element: ${payload.selector}`);

    return { typed: true, text: payload.text };
  }

  // Handle extract action
  private async handleExtract(payload: ExtractPayload): Promise<ExtractedData | ExtractedData[]> {
    this.log('info', `Extracting from element: ${payload.selector}`);
    this.setProgress(10);

    const extractFromElement = (element: Element): ExtractedData => {
      let value: string | string[];

      switch (payload.type) {
        case 'text':
          value = element.textContent?.trim() || '';
          break;
        case 'html':
          value = element.innerHTML;
          break;
        case 'attribute':
          if (!payload.attribute) {
            throw new Error('Attribute name required for attribute extraction');
          }
          value = element.getAttribute(payload.attribute) || '';
          break;
        case 'value':
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            value = element.value;
          } else if (element instanceof HTMLSelectElement) {
            value = element.value;
          } else {
            value = element.textContent?.trim() || '';
          }
          break;
        case 'list':
          // Get all direct children's text
          value = Array.from(element.children).map(child => child.textContent?.trim() || '');
          break;
        default:
          value = element.textContent?.trim() || '';
      }

      return {
        selector: payload.selector,
        type: payload.type,
        value,
        attribute: payload.attribute,
      };
    };

    this.setProgress(50);

    if (payload.multiple) {
      const elements = this.getElements(payload.selector);
      const results = elements.map(extractFromElement);
      this.setProgress(100);
      this.log('info', `Extracted from ${results.length} elements`);
      return results;
    } else {
      const element = this.getElement(payload.selector);
      if (!element) {
        throw new Error(`Element not found: ${payload.selector}`);
      }
      const result = extractFromElement(element);
      this.setProgress(100);
      this.log('info', `Extracted content from element: ${payload.selector}`);
      return result;
    }
  }

  // Handle scroll action
  private async handleScroll(payload: ScrollPayload): Promise<{ scrolled: boolean }> {
    this.log('info', 'Scrolling page');
    this.setProgress(10);

    if (payload.selector) {
      const element = this.getElement(payload.selector);
      if (!element) {
        throw new Error(`Element not found: ${payload.selector}`);
      }

      element.scrollIntoView({
        behavior: payload.behavior || 'smooth',
        block: 'center',
      });
    } else if (payload.position) {
      window.scrollTo({
        left: payload.position.x,
        top: payload.position.y,
        behavior: payload.behavior || 'smooth',
      });
    }

    // Wait for scroll to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    this.setProgress(100);
    this.log('info', 'Scroll completed');

    return { scrolled: true };
  }

  // Handle wait action
  private async handleWait(payload: WaitPayload): Promise<{ found: boolean; element?: string }> {
    this.log('info', `Waiting for condition`);
    this.setProgress(10);

    const timeout = payload.timeout || 10000;

    if (payload.selector) {
      try {
        const element = await this.waitForElement(
          payload.selector,
          timeout,
          payload.condition || 'exists'
        );

        this.setProgress(100);

        if (element && payload.text) {
          const text = element.textContent || '';
          if (!text.includes(payload.text)) {
            throw new Error(`Element found but text "${payload.text}" not found`);
          }
        }

        return {
          found: !!element || payload.condition === 'hidden' || payload.condition === 'removed',
          element: element?.outerHTML?.substring(0, 200),
        };
      } catch (error) {
        this.log('warn', `Wait failed: ${error instanceof Error ? error.message : String(error)}`);
        return { found: false };
      }
    }

    // Just wait for the specified time
    await new Promise(resolve => setTimeout(resolve, timeout));
    this.setProgress(100);

    return { found: true };
  }

  // Handle screenshot action
  private async handleScreenshot(_payload: ScreenshotPayload): Promise<{ dataUrl: string | null }> {
    this.log('info', 'Taking screenshot');
    this.setProgress(10);

    // Note: This is a simplified version. Full screenshot capability
    // would require canvas rendering or a native API
    try {
      // For now, we'll just indicate the capability exists
      // In Tauri, this would use a native screenshot API
      // In PWA, we'd need to use html2canvas or similar
      this.setProgress(100);
      this.log('warn', 'Screenshot requires html2canvas or native API');

      return { dataUrl: null };
    } catch (error) {
      this.log('error', `Screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
      return { dataUrl: null };
    }
  }

  protected onTerminate(): void {
    this.iframeRef = null;
    this.log('info', 'DOMAgent terminated');
  }
}

// Factory function
function createDOMAgent(config?: Partial<AgentConfig>): DOMAgent {
  return new DOMAgent(config);
}

// Register the agent type
AgentRegistry.register(DOM_AGENT_METADATA, createDOMAgent);

export { DOM_AGENT_METADATA };
