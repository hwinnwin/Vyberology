/**
 * THE VYBER - Navigation Agent
 * Multi-page navigation, URL handling, and page flow orchestration
 *
 * Smarter than Atlas's wandering agent - we know where we're going
 */

import {
  BaseAgent,
  defineAgent,
  defineCapability,
  AgentRegistry,
} from '../core/AgentRegistry';
import type { Task, AgentConfig } from '../types';

// Capabilities
const NAVIGATE_CAPABILITY = defineCapability(
  'navigation.go',
  'Navigate to URL',
  'Navigate to a specific URL',
  ['navigation.control']
);

const BACK_CAPABILITY = defineCapability(
  'navigation.back',
  'Go Back',
  'Navigate to the previous page',
  ['navigation.control']
);

const FORWARD_CAPABILITY = defineCapability(
  'navigation.forward',
  'Go Forward',
  'Navigate to the next page',
  ['navigation.control']
);

const REFRESH_CAPABILITY = defineCapability(
  'navigation.refresh',
  'Refresh Page',
  'Reload the current page',
  ['navigation.control']
);

const WAIT_FOR_LOAD_CAPABILITY = defineCapability(
  'navigation.waitForLoad',
  'Wait for Page Load',
  'Wait for a page to finish loading',
  ['navigation.read']
);

const GET_URL_CAPABILITY = defineCapability(
  'navigation.getUrl',
  'Get Current URL',
  'Get the current page URL',
  ['navigation.read']
);

const CLICK_LINK_CAPABILITY = defineCapability(
  'navigation.clickLink',
  'Click Link',
  'Click a link and optionally wait for navigation',
  ['navigation.control', 'dom.interact']
);

const MULTI_PAGE_CAPABILITY = defineCapability(
  'navigation.multiPage',
  'Multi-Page Flow',
  'Execute a sequence of navigation steps',
  ['navigation.control']
);

// Agent metadata
const NAVIGATION_AGENT_METADATA = defineAgent(
  'navigation-agent',
  'Navigation Agent',
  'Handles page navigation, URL management, and multi-page flows',
  [
    NAVIGATE_CAPABILITY,
    BACK_CAPABILITY,
    FORWARD_CAPABILITY,
    REFRESH_CAPABILITY,
    WAIT_FOR_LOAD_CAPABILITY,
    GET_URL_CAPABILITY,
    CLICK_LINK_CAPABILITY,
    MULTI_PAGE_CAPABILITY,
  ],
  {
    maxConcurrentTasks: 1,
    defaultTimeout: 30000,
  }
);

// Navigation step for multi-page flows
export interface NavigationStep {
  action: 'go' | 'click' | 'wait' | 'back' | 'forward' | 'refresh';
  url?: string;
  selector?: string;
  waitFor?: {
    type: 'url' | 'element' | 'time' | 'networkIdle';
    value: string | number;
    timeout?: number;
  };
  validate?: {
    type: 'url_contains' | 'url_matches' | 'element_exists' | 'element_text';
    value: string;
  };
}

// Page info
export interface PageInfo {
  url: string;
  title: string;
  loadTime: number;
  domain: string;
  protocol: string;
  pathname: string;
  search: string;
  hash: string;
}

// Navigation result
export interface NavigationResult {
  success: boolean;
  url: string;
  title: string;
  loadTime: number;
  error?: string;
}

// Task payloads
interface GoPayload {
  url: string;
  waitForLoad?: boolean;
  timeout?: number;
}

interface BackForwardPayload {
  waitForLoad?: boolean;
  timeout?: number;
}

interface RefreshPayload {
  hardRefresh?: boolean;
  waitForLoad?: boolean;
  timeout?: number;
}

interface WaitForLoadPayload {
  timeout?: number;
  waitFor?: 'load' | 'domcontentloaded' | 'networkidle';
}

interface ClickLinkPayload {
  selector: string;
  waitForNavigation?: boolean;
  newTab?: boolean;
  timeout?: number;
}

interface MultiPagePayload {
  steps: NavigationStep[];
  stopOnError?: boolean;
}

/**
 * NavigationAgent - Handles page navigation
 */
export class NavigationAgent extends BaseAgent {
  private iframeRef: HTMLIFrameElement | null = null;
  private navigationCallbacks: Map<string, (success: boolean) => void> = new Map();

  constructor(config?: Partial<AgentConfig>) {
    super({
      ...NAVIGATION_AGENT_METADATA,
      config: { ...NAVIGATION_AGENT_METADATA.config, ...config },
    });
  }

  setIframeRef(ref: HTMLIFrameElement | null): void {
    this.iframeRef = ref;
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'NavigationAgent initialized');
  }

  protected async onExecute(task: Task): Promise<unknown> {
    const actionType = task.type.replace('navigation.', '');
    const payload = task.payload as Record<string, unknown>;

    switch (actionType) {
      case 'go':
        return this.handleNavigate(payload as unknown as GoPayload);
      case 'back':
        return this.handleBack(payload as unknown as BackForwardPayload);
      case 'forward':
        return this.handleForward(payload as unknown as BackForwardPayload);
      case 'refresh':
        return this.handleRefresh(payload as unknown as RefreshPayload);
      case 'waitForLoad':
        return this.handleWaitForLoad(payload as unknown as WaitForLoadPayload);
      case 'getUrl':
        return this.handleGetUrl();
      case 'clickLink':
        return this.handleClickLink(payload as unknown as ClickLinkPayload);
      case 'multiPage':
        return this.handleMultiPage(payload as unknown as MultiPagePayload);
      default:
        throw new Error(`Unknown navigation action: ${actionType}`);
    }
  }

  private getWindow(): Window {
    if (this.iframeRef?.contentWindow) {
      return this.iframeRef.contentWindow;
    }
    return window;
  }

  private getDocument(): Document {
    if (this.iframeRef?.contentDocument) {
      return this.iframeRef.contentDocument;
    }
    return document;
  }

  private getCurrentUrl(): string {
    try {
      if (this.iframeRef?.contentWindow) {
        return this.iframeRef.contentWindow.location.href;
      }
      return window.location.href;
    } catch {
      // Cross-origin restriction
      return this.iframeRef?.src || window.location.href;
    }
  }

  private getCurrentTitle(): string {
    try {
      return this.getDocument().title;
    } catch {
      return '';
    }
  }

  /**
   * Navigate to a URL
   */
  private async handleNavigate(payload: GoPayload): Promise<NavigationResult> {
    this.log('info', `Navigating to: ${payload.url}`);
    this.setProgress(10);

    const startTime = Date.now();
    let url = payload.url;

    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    try {
      // Validate URL
      new URL(url);
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }

    this.setProgress(30);

    // Perform navigation
    if (this.iframeRef) {
      this.iframeRef.src = url;
    } else {
      this.getWindow().location.href = url;
    }

    this.setProgress(50);

    // Wait for load if requested
    if (payload.waitForLoad !== false) {
      await this.waitForPageLoad(payload.timeout || 30000);
    }

    const loadTime = Date.now() - startTime;
    this.setProgress(100);

    this.log('info', `Navigation complete: ${url} (${loadTime}ms)`);

    return {
      success: true,
      url: this.getCurrentUrl(),
      title: this.getCurrentTitle(),
      loadTime,
    };
  }

  /**
   * Go back in history
   */
  private async handleBack(payload: BackForwardPayload): Promise<NavigationResult> {
    this.log('info', 'Navigating back');
    this.setProgress(10);

    const startTime = Date.now();

    this.getWindow().history.back();

    this.setProgress(50);

    if (payload.waitForLoad !== false) {
      await this.waitForPageLoad(payload.timeout || 30000);
    }

    const loadTime = Date.now() - startTime;
    this.setProgress(100);

    return {
      success: true,
      url: this.getCurrentUrl(),
      title: this.getCurrentTitle(),
      loadTime,
    };
  }

  /**
   * Go forward in history
   */
  private async handleForward(payload: BackForwardPayload): Promise<NavigationResult> {
    this.log('info', 'Navigating forward');
    this.setProgress(10);

    const startTime = Date.now();

    this.getWindow().history.forward();

    this.setProgress(50);

    if (payload.waitForLoad !== false) {
      await this.waitForPageLoad(payload.timeout || 30000);
    }

    const loadTime = Date.now() - startTime;
    this.setProgress(100);

    return {
      success: true,
      url: this.getCurrentUrl(),
      title: this.getCurrentTitle(),
      loadTime,
    };
  }

  /**
   * Refresh the page
   */
  private async handleRefresh(payload: RefreshPayload): Promise<NavigationResult> {
    this.log('info', 'Refreshing page');
    this.setProgress(10);

    const startTime = Date.now();

    if (payload.hardRefresh) {
      this.getWindow().location.reload();
    } else {
      this.getWindow().location.reload();
    }

    this.setProgress(50);

    if (payload.waitForLoad !== false) {
      await this.waitForPageLoad(payload.timeout || 30000);
    }

    const loadTime = Date.now() - startTime;
    this.setProgress(100);

    return {
      success: true,
      url: this.getCurrentUrl(),
      title: this.getCurrentTitle(),
      loadTime,
    };
  }

  /**
   * Wait for page to load
   */
  private async handleWaitForLoad(payload: WaitForLoadPayload): Promise<{ loaded: boolean; loadTime: number }> {
    this.log('info', 'Waiting for page load');
    this.setProgress(10);

    const startTime = Date.now();
    const timeout = payload.timeout || 30000;

    await this.waitForPageLoad(timeout);

    const loadTime = Date.now() - startTime;
    this.setProgress(100);

    return { loaded: true, loadTime };
  }

  /**
   * Get current URL and page info
   */
  private async handleGetUrl(): Promise<PageInfo> {
    this.log('info', 'Getting current URL');
    this.setProgress(50);

    const url = this.getCurrentUrl();

    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      this.setProgress(100);
      return {
        url,
        title: this.getCurrentTitle(),
        loadTime: 0,
        domain: '',
        protocol: '',
        pathname: '',
        search: '',
        hash: '',
      };
    }

    this.setProgress(100);

    return {
      url,
      title: this.getCurrentTitle(),
      loadTime: 0,
      domain: urlObj.hostname,
      protocol: urlObj.protocol,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
    };
  }

  /**
   * Click a link and optionally wait for navigation
   */
  private async handleClickLink(payload: ClickLinkPayload): Promise<NavigationResult> {
    this.log('info', `Clicking link: ${payload.selector}`);
    this.setProgress(10);

    const startTime = Date.now();
    const doc = this.getDocument();

    const element = doc.querySelector(payload.selector);
    if (!element) {
      throw new Error(`Link not found: ${payload.selector}`);
    }

    this.setProgress(30);

    // Handle new tab
    if (payload.newTab && element instanceof HTMLAnchorElement) {
      const href = element.href;
      if (href) {
        // Open in new tab (note: this may be blocked by popup blockers)
        window.open(href, '_blank');
        this.setProgress(100);
        return {
          success: true,
          url: href,
          title: '',
          loadTime: Date.now() - startTime,
        };
      }
    }

    // Scroll into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 300));

    this.setProgress(50);

    // Click the element
    if (element instanceof HTMLElement) {
      element.click();
    } else {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      element.dispatchEvent(clickEvent);
    }

    this.setProgress(70);

    // Wait for navigation if requested
    if (payload.waitForNavigation !== false) {
      await this.waitForPageLoad(payload.timeout || 30000);
    }

    const loadTime = Date.now() - startTime;
    this.setProgress(100);

    this.log('info', `Link clicked and navigation complete`);

    return {
      success: true,
      url: this.getCurrentUrl(),
      title: this.getCurrentTitle(),
      loadTime,
    };
  }

  /**
   * Execute a multi-page navigation flow
   */
  private async handleMultiPage(payload: MultiPagePayload): Promise<{
    success: boolean;
    completedSteps: number;
    totalSteps: number;
    results: NavigationResult[];
    error?: string;
  }> {
    this.log('info', `Starting multi-page flow with ${payload.steps.length} steps`);
    this.setProgress(5);

    const results: NavigationResult[] = [];
    const totalSteps = payload.steps.length;
    let completedSteps = 0;

    for (let i = 0; i < payload.steps.length; i++) {
      const step = payload.steps[i];
      const stepProgress = ((i + 1) / totalSteps) * 90 + 5;

      this.log('info', `Executing step ${i + 1}/${totalSteps}: ${step.action}`);

      try {
        let result: NavigationResult;

        switch (step.action) {
          case 'go':
            if (!step.url) throw new Error('URL required for go action');
            result = await this.handleNavigate({ url: step.url, waitForLoad: true });
            break;

          case 'click':
            if (!step.selector) throw new Error('Selector required for click action');
            result = await this.handleClickLink({
              selector: step.selector,
              waitForNavigation: true,
            });
            break;

          case 'wait':
            if (step.waitFor) {
              await this.handleWaitCondition(step.waitFor);
            }
            result = {
              success: true,
              url: this.getCurrentUrl(),
              title: this.getCurrentTitle(),
              loadTime: 0,
            };
            break;

          case 'back':
            result = await this.handleBack({ waitForLoad: true });
            break;

          case 'forward':
            result = await this.handleForward({ waitForLoad: true });
            break;

          case 'refresh':
            result = await this.handleRefresh({ waitForLoad: true });
            break;

          default:
            throw new Error(`Unknown step action: ${step.action}`);
        }

        // Validate if specified
        if (step.validate) {
          const validationPassed = await this.validateCondition(step.validate);
          if (!validationPassed) {
            throw new Error(`Validation failed: ${step.validate.type} - ${step.validate.value}`);
          }
        }

        results.push(result);
        completedSteps++;
        this.setProgress(stepProgress);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.log('error', `Step ${i + 1} failed: ${errorMessage}`);

        results.push({
          success: false,
          url: this.getCurrentUrl(),
          title: this.getCurrentTitle(),
          loadTime: 0,
          error: errorMessage,
        });

        if (payload.stopOnError !== false) {
          this.setProgress(100);
          return {
            success: false,
            completedSteps,
            totalSteps,
            results,
            error: errorMessage,
          };
        }
      }
    }

    this.setProgress(100);
    this.log('info', `Multi-page flow completed: ${completedSteps}/${totalSteps} steps`);

    return {
      success: completedSteps === totalSteps,
      completedSteps,
      totalSteps,
      results,
    };
  }

  /**
   * Wait for a page load condition
   */
  private waitForPageLoad(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Page load timeout'));
      }, timeout);

      // For iframes, wait for load event
      if (this.iframeRef) {
        const onLoad = () => {
          clearTimeout(timeoutId);
          this.iframeRef?.removeEventListener('load', onLoad);
          resolve();
        };

        this.iframeRef.addEventListener('load', onLoad);
      } else {
        // For main window, check document ready state
        const checkReady = () => {
          if (document.readyState === 'complete') {
            clearTimeout(timeoutId);
            resolve();
          } else {
            requestAnimationFrame(checkReady);
          }
        };

        checkReady();
      }
    });
  }

  /**
   * Handle wait conditions
   */
  private async handleWaitCondition(waitFor: NavigationStep['waitFor']): Promise<void> {
    if (!waitFor) return;

    const timeout = waitFor.timeout || 30000;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const check = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Wait timeout: ${waitFor.type}`));
          return;
        }

        let conditionMet = false;

        switch (waitFor.type) {
          case 'url':
            conditionMet = this.getCurrentUrl().includes(String(waitFor.value));
            break;

          case 'element':
            conditionMet = !!this.getDocument().querySelector(String(waitFor.value));
            break;

          case 'time':
            setTimeout(resolve, Number(waitFor.value));
            return;

          case 'networkIdle':
            // Simplified - wait a fixed amount
            setTimeout(resolve, 1000);
            return;
        }

        if (conditionMet) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };

      check();
    });
  }

  /**
   * Validate a condition
   */
  private async validateCondition(validate: NavigationStep['validate']): Promise<boolean> {
    if (!validate) return true;

    const url = this.getCurrentUrl();
    const doc = this.getDocument();

    switch (validate.type) {
      case 'url_contains':
        return url.includes(validate.value);

      case 'url_matches':
        return new RegExp(validate.value).test(url);

      case 'element_exists':
        return !!doc.querySelector(validate.value);

      case 'element_text':
        const [selector, text] = validate.value.split('::');
        const element = doc.querySelector(selector);
        return element?.textContent?.includes(text) || false;

      default:
        return true;
    }
  }

  protected onTerminate(): void {
    this.iframeRef = null;
    this.navigationCallbacks.clear();
    this.log('info', 'NavigationAgent terminated');
  }
}

// Factory function
function createNavigationAgent(config?: Partial<AgentConfig>): NavigationAgent {
  return new NavigationAgent(config);
}

// Register the agent type
AgentRegistry.register(NAVIGATION_AGENT_METADATA, createNavigationAgent);

export { NAVIGATION_AGENT_METADATA };
