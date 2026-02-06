import { invoke } from "@tauri-apps/api/core";

export async function createTab(tabId: string, url: string): Promise<void> {
  try {
    await invoke("create_tab", { tabId, url });
  } catch (error) {
    console.error("Failed to create tab:", error);
  }
}

export async function navigateTab(tabId: string, url: string): Promise<void> {
  try {
    await invoke("navigate_tab", { tabId, url });
  } catch (error) {
    console.error("Failed to navigate:", error);
  }
}

export async function closeTab(tabId: string): Promise<void> {
  try {
    await invoke("close_tab", { tabId });
  } catch (error) {
    console.error("Failed to close tab:", error);
  }
}

export async function showTab(tabId: string): Promise<void> {
  try {
    await invoke("show_tab", { tabId });
  } catch (error) {
    console.error("Failed to show tab:", error);
  }
}
