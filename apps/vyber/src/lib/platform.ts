/**
 * Platform detection and abstraction layer
 * Allows VybeR to run both as a Tauri desktop app and as a PWA
 */

// Detect if we're running in Tauri
export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
export const isPWA = !isTauri;

// Tab management abstraction
export interface PlatformTabManager {
  createTab(tabId: string, url: string): Promise<void>;
  navigateTab(tabId: string, url: string): Promise<void>;
  closeTab(tabId: string): Promise<void>;
  showTab(tabId: string): Promise<void>;
}

// Web/PWA implementation - uses iframes
class WebTabManager implements PlatformTabManager {
  private tabs: Map<string, { url: string }> = new Map();

  async createTab(tabId: string, url: string): Promise<void> {
    this.tabs.set(tabId, { url });
    console.log(`[Web] Created tab ${tabId} with URL: ${url}`);
  }

  async navigateTab(tabId: string, url: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.url = url;
    } else {
      this.tabs.set(tabId, { url });
    }
    console.log(`[Web] Navigated tab ${tabId} to: ${url}`);
  }

  async closeTab(tabId: string): Promise<void> {
    this.tabs.delete(tabId);
    console.log(`[Web] Closed tab ${tabId}`);
  }

  async showTab(tabId: string): Promise<void> {
    console.log(`[Web] Showing tab ${tabId}`);
  }
}

// Tauri implementation - uses native webviews
class TauriTabManager implements PlatformTabManager {
  private invoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;

  private async getInvoke() {
    if (!this.invoke) {
      const tauri = await import('@tauri-apps/api/core');
      this.invoke = tauri.invoke;
    }
    return this.invoke;
  }

  async createTab(tabId: string, url: string): Promise<void> {
    try {
      const invoke = await this.getInvoke();
      await invoke("create_tab", { tabId, url });
    } catch (error) {
      console.error("Failed to create tab:", error);
    }
  }

  async navigateTab(tabId: string, url: string): Promise<void> {
    try {
      const invoke = await this.getInvoke();
      await invoke("navigate_tab", { tabId, url });
    } catch (error) {
      console.error("Failed to navigate:", error);
    }
  }

  async closeTab(tabId: string): Promise<void> {
    try {
      const invoke = await this.getInvoke();
      await invoke("close_tab", { tabId });
    } catch (error) {
      console.error("Failed to close tab:", error);
    }
  }

  async showTab(tabId: string): Promise<void> {
    try {
      const invoke = await this.getInvoke();
      await invoke("show_tab", { tabId });
    } catch (error) {
      console.error("Failed to show tab:", error);
    }
  }
}

// Export the appropriate manager based on platform
export const tabManager: PlatformTabManager = isTauri
  ? new TauriTabManager()
  : new WebTabManager();

// Re-export convenience functions matching the old API
export const createTab = (tabId: string, url: string) => tabManager.createTab(tabId, url);
export const navigateTab = (tabId: string, url: string) => tabManager.navigateTab(tabId, url);
export const closeTab = (tabId: string) => tabManager.closeTab(tabId);
export const showTab = (tabId: string) => tabManager.showTab(tabId);
