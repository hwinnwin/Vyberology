import { describe, expect, it, beforeEach } from "vitest";
import { useTabsStore } from "./tabs";

const createInitialState = () => ({
  tabs: [
    {
      id: "tab-1",
      url: "vyber://newtab",
      title: "New Tab",
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      reloadToken: 0,
    },
  ],
  activeTabId: "tab-1",
});

describe("tabs store", () => {
  beforeEach(() => {
    useTabsStore.setState(createInitialState(), true);
  });

  it("normalizes URLs and guards unsafe protocols", () => {
    const { navigate } = useTabsStore.getState();
    navigate("tab-1", "example.com");
    expect(useTabsStore.getState().tabs[0].url).toBe("https://example.com");

    navigate("tab-1", "javascript:alert(1)");
    expect(useTabsStore.getState().tabs[0].url).toContain("https://www.google.com/search?q=");
  });

  it("updates reload token on refresh", () => {
    const { refreshTab } = useTabsStore.getState();
    const beforeToken = useTabsStore.getState().tabs[0].reloadToken;
    refreshTab("tab-1");
    const afterToken = useTabsStore.getState().tabs[0].reloadToken;
    expect(afterToken).toBeGreaterThan(beforeToken);
  });
});
