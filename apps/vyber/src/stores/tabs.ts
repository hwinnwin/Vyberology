import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  reloadToken: number;
  history?: string[]; // Navigation history for this tab
  historyIndex?: number;
  pinnedAt?: number; // Timestamp if pinned
  groupId?: string; // Tab group ID
}

export interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: number;
  favicon?: string;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  createdAt: number;
  folderId?: string;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: number;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
}

export type SplitDirection = "horizontal" | "vertical";

interface SplitViewState {
  enabled: boolean;
  direction: SplitDirection;
  leftTabId: string | null;
  rightTabId: string | null;
  splitRatio: number; // 0-100 percentage for left/top pane
  activePane: "left" | "right";
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  splitView: SplitViewState;

  // History & Bookmarks
  history: HistoryEntry[];
  bookmarks: Bookmark[];
  bookmarkFolders: BookmarkFolder[];
  tabGroups: TabGroup[];

  // Recently closed tabs (for undo)
  recentlyClosed: Tab[];

  // Actions
  addTab: (url?: string) => string;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
  navigate: (id: string, url: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  refreshTab: (id: string) => void;

  // Tab management
  pinTab: (id: string) => void;
  unpinTab: (id: string) => void;
  duplicateTab: (id: string) => string;
  reopenClosedTab: () => void;

  // History & Bookmarks
  addToHistory: (entry: Omit<HistoryEntry, "visitedAt">) => void;
  clearHistory: () => void;
  addBookmark: (bookmark: Omit<Bookmark, "id" | "createdAt">) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (url: string) => boolean;

  // Tab groups
  createTabGroup: (name: string, color?: string) => string;
  addTabToGroup: (tabId: string, groupId: string) => void;
  removeTabFromGroup: (tabId: string) => void;
  toggleGroupCollapsed: (groupId: string) => void;

  // Split view actions
  enableSplitView: (direction?: SplitDirection) => void;
  disableSplitView: () => void;
  toggleSplitView: () => void;
  setSplitDirection: (direction: SplitDirection) => void;
  setSplitRatio: (ratio: number) => void;
  setActivePane: (pane: "left" | "right") => void;
  openInSplitView: (tabId: string, pane: "left" | "right") => void;
  swapSplitPanes: () => void;
}

const NEW_TAB_URL = "vyber://newtab";
const BLOCKED_PROTOCOLS = ["javascript:", "data:", "file:"];

function generateId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const DEFAULT_SPLIT_VIEW: SplitViewState = {
  enabled: false,
  direction: "vertical",
  leftTabId: null,
  rightTabId: null,
  splitRatio: 50,
  activePane: "left",
};

const MAX_HISTORY_ENTRIES = 1000;
const MAX_RECENTLY_CLOSED = 25;

const TAB_GROUP_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
  tabs: [
    {
      id: generateId(),
      url: NEW_TAB_URL,
      title: "New Tab",
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      reloadToken: Date.now(),
    },
  ],
  activeTabId: null,
  splitView: DEFAULT_SPLIT_VIEW,
  history: [],
  bookmarks: [],
  bookmarkFolders: [],
  tabGroups: [],
  recentlyClosed: [],

  addTab: (url = NEW_TAB_URL) => {
    const newTab: Tab = {
      id: generateId(),
      url,
      title: url === NEW_TAB_URL ? "New Tab" : "Loading...",
      isLoading: url !== NEW_TAB_URL,
      canGoBack: false,
      canGoForward: false,
      reloadToken: Date.now(),
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));

    return newTab.id;
  },

  closeTab: (id: string) => {
    set((state) => {
      const closedTab = state.tabs.find((tab) => tab.id === id);
      const tabs = state.tabs.filter((tab) => tab.id !== id);

      // Save to recently closed (unless it's just a new tab)
      let recentlyClosed = state.recentlyClosed;
      if (closedTab && closedTab.url !== NEW_TAB_URL) {
        recentlyClosed = [closedTab, ...state.recentlyClosed].slice(0, MAX_RECENTLY_CLOSED);
      }

      // If we closed the active tab, activate the previous one
      let activeTabId = state.activeTabId;
      if (activeTabId === id && tabs.length > 0) {
        const closedIndex = state.tabs.findIndex((t) => t.id === id);
        const newActiveIndex = Math.max(0, closedIndex - 1);
        activeTabId = tabs[newActiveIndex]?.id ?? null;
      }

      // If no tabs left, create a new one
      if (tabs.length === 0) {
        const newTab: Tab = {
          id: generateId(),
          url: NEW_TAB_URL,
          title: "New Tab",
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          reloadToken: Date.now(),
        };
        return { tabs: [newTab], activeTabId: newTab.id, recentlyClosed };
      }

      return { tabs, activeTabId, recentlyClosed };
    });
  },

  setActiveTab: (id: string) => {
    set({ activeTabId: id });
  },

  updateTab: (id: string, updates: Partial<Tab>) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, ...updates } : tab
      ),
    }));
  },

  navigate: (id: string, url: string) => {
    // Normalize URL
    let normalizedUrl = url.trim();

    if (normalizedUrl.startsWith(NEW_TAB_URL)) {
      normalizedUrl = NEW_TAB_URL;
    }

    const lowerUrl = normalizedUrl.toLowerCase();
    if (BLOCKED_PROTOCOLS.some((protocol) => lowerUrl.startsWith(protocol))) {
      normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(normalizedUrl)}`;
    }

    if (!normalizedUrl.match(/^[a-z]+:\/\//i)) {
      if (normalizedUrl.includes(".") && !normalizedUrl.includes(" ")) {
        normalizedUrl = `https://${normalizedUrl}`;
      } else {
        normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(normalizedUrl)}`;
      }
    }

    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              url: normalizedUrl,
              isLoading: true,
              title: "Loading...",
              reloadToken: Date.now(),
            }
          : tab
      ),
    }));
  },

  reorderTabs: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const tabs = [...state.tabs];
      const [removed] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, removed);
      return { tabs };
    });
  },

  refreshTab: (id: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? { ...tab, isLoading: true, reloadToken: Date.now() }
          : tab
      ),
    }));
  },

  // Split view actions
  enableSplitView: (direction = "vertical") => {
    const { tabs, activeTabId } = get();
    const activeIndex = tabs.findIndex((t) => t.id === activeTabId);

    // Use current tab for left, next tab (or new tab) for right
    const leftTabId = activeTabId;
    let rightTabId = tabs[activeIndex + 1]?.id || null;

    // If no second tab exists, create one
    if (!rightTabId && tabs.length === 1) {
      const newTab: Tab = {
        id: generateId(),
        url: NEW_TAB_URL,
        title: "New Tab",
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        reloadToken: Date.now(),
      };
      set((state) => ({
        tabs: [...state.tabs, newTab],
        splitView: {
          enabled: true,
          direction,
          leftTabId,
          rightTabId: newTab.id,
          splitRatio: 50,
          activePane: "left",
        },
      }));
      return;
    }

    set({
      splitView: {
        enabled: true,
        direction,
        leftTabId,
        rightTabId: rightTabId || tabs[0]?.id || null,
        splitRatio: 50,
        activePane: "left",
      },
    });
  },

  disableSplitView: () => {
    const { splitView } = get();
    const activeTabId = splitView.activePane === "left"
      ? splitView.leftTabId
      : splitView.rightTabId;

    set({
      splitView: DEFAULT_SPLIT_VIEW,
      activeTabId: activeTabId || get().tabs[0]?.id || null,
    });
  },

  toggleSplitView: () => {
    const { splitView } = get();
    if (splitView.enabled) {
      get().disableSplitView();
    } else {
      get().enableSplitView();
    }
  },

  setSplitDirection: (direction) => {
    set((state) => ({
      splitView: { ...state.splitView, direction },
    }));
  },

  setSplitRatio: (ratio) => {
    set((state) => ({
      splitView: { ...state.splitView, splitRatio: Math.max(20, Math.min(80, ratio)) },
    }));
  },

  setActivePane: (pane) => {
    const { splitView } = get();
    const activeTabId = pane === "left" ? splitView.leftTabId : splitView.rightTabId;

    set((state) => ({
      splitView: { ...state.splitView, activePane: pane },
      activeTabId,
    }));
  },

  openInSplitView: (tabId, pane) => {
    set((state) => ({
      splitView: {
        ...state.splitView,
        [pane === "left" ? "leftTabId" : "rightTabId"]: tabId,
        activePane: pane,
      },
      activeTabId: tabId,
    }));
  },

  swapSplitPanes: () => {
    set((state) => ({
      splitView: {
        ...state.splitView,
        leftTabId: state.splitView.rightTabId,
        rightTabId: state.splitView.leftTabId,
      },
    }));
  },

  // Tab management
  pinTab: (id: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, pinnedAt: Date.now() } : tab
      ).sort((a, b) => {
        // Pinned tabs first
        if (a.pinnedAt && !b.pinnedAt) return -1;
        if (!a.pinnedAt && b.pinnedAt) return 1;
        return 0;
      }),
    }));
  },

  unpinTab: (id: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, pinnedAt: undefined } : tab
      ),
    }));
  },

  duplicateTab: (id: string) => {
    const tab = get().tabs.find((t) => t.id === id);
    if (!tab) return "";

    const newTab: Tab = {
      ...tab,
      id: generateId(),
      pinnedAt: undefined,
      reloadToken: Date.now(),
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));

    return newTab.id;
  },

  reopenClosedTab: () => {
    const { recentlyClosed } = get();
    if (recentlyClosed.length === 0) return;

    const [tabToReopen, ...rest] = recentlyClosed;
    const restoredTab: Tab = {
      ...tabToReopen,
      id: generateId(),
      reloadToken: Date.now(),
      isLoading: tabToReopen.url !== NEW_TAB_URL,
    };

    set((state) => ({
      tabs: [...state.tabs, restoredTab],
      activeTabId: restoredTab.id,
      recentlyClosed: rest,
    }));
  },

  // History & Bookmarks
  addToHistory: (entry) => {
    set((state) => {
      const newEntry: HistoryEntry = {
        ...entry,
        visitedAt: Date.now(),
      };

      // Don't add duplicates within 1 minute
      const recentDuplicate = state.history.find(
        (h) => h.url === entry.url && Date.now() - h.visitedAt < 60000
      );
      if (recentDuplicate) return state;

      const history = [newEntry, ...state.history].slice(0, MAX_HISTORY_ENTRIES);
      return { history };
    });
  },

  clearHistory: () => {
    set({ history: [] });
  },

  addBookmark: (bookmark) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: generateId(),
      createdAt: Date.now(),
    };

    set((state) => ({
      bookmarks: [...state.bookmarks, newBookmark],
    }));
  },

  removeBookmark: (id: string) => {
    set((state) => ({
      bookmarks: state.bookmarks.filter((b) => b.id !== id),
    }));
  },

  isBookmarked: (url: string) => {
    return get().bookmarks.some((b) => b.url === url);
  },

  // Tab groups
  createTabGroup: (name: string, color?: string) => {
    const id = generateId();
    const groupColor = color || TAB_GROUP_COLORS[get().tabGroups.length % TAB_GROUP_COLORS.length];

    set((state) => ({
      tabGroups: [...state.tabGroups, { id, name, color: groupColor, collapsed: false }],
    }));

    return id;
  },

  addTabToGroup: (tabId: string, groupId: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, groupId } : tab
      ),
    }));
  },

  removeTabFromGroup: (tabId: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, groupId: undefined } : tab
      ),
    }));
  },

  toggleGroupCollapsed: (groupId: string) => {
    set((state) => ({
      tabGroups: state.tabGroups.map((group) =>
        group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
      ),
    }));
  },
    }),
    {
      name: "vyber-tabs-storage",
      version: 1,
      partialize: (state) => ({
        // Persist these fields
        tabs: state.tabs.map((tab) => ({
          ...tab,
          isLoading: false, // Don't persist loading state
          reloadToken: 0,
        })),
        history: state.history,
        bookmarks: state.bookmarks,
        bookmarkFolders: state.bookmarkFolders,
        tabGroups: state.tabGroups,
        // Don't persist: activeTabId, splitView, recentlyClosed
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, set active tab to first tab
        if (state && state.tabs.length > 0) {
          useTabsStore.setState({ activeTabId: state.tabs[0].id });
        }
      },
    }
  )
);

// Initialize active tab (for fresh state)
const initialState = useTabsStore.getState();
if (initialState.tabs.length > 0 && !initialState.activeTabId) {
  useTabsStore.setState({ activeTabId: initialState.tabs[0].id });
}
