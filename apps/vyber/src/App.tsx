import { lazy, Suspense, useEffect, useState } from "react";
import { Bot, Monitor, Globe } from "lucide-react";
import { TabBar, AddressBar, WebContent } from "./components/browser";
import { OfflineBanner } from "./components/OfflineBanner";
import { ToastViewport } from "./components/ToastViewport";
import { NetworkStatusListener } from "./components/NetworkStatusListener";
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { CookieConsent } from "./components/CookieConsent";
import { useTabsStore } from "./stores/tabs";
import { useAIStore } from "./stores/ai";
import { useAgentStore } from "./stores/agent";

// Lazy load VybeOS for better initial load
const VybeOS = lazy(() =>
  import("./components/os/VybeOS").then((module) => ({
    default: module.VybeOS,
  }))
);

const CommandPalette = lazy(() =>
  import("./components/ai/CommandPalette").then((module) => ({
    default: module.CommandPalette,
  }))
);
const Settings = lazy(() =>
  import("./components/Settings").then((module) => ({
    default: module.Settings,
  }))
);
const AgentPanel = lazy(() =>
  import("./components/ai/AgentPanel").then((module) => ({
    default: module.AgentPanel,
  }))
);

// App mode: "browser" for traditional browser, "os" for full desktop OS
type AppMode = "browser" | "os";

function App() {
  const {
    addTab, closeTab, activeTabId, tabs, setActiveTab,
    toggleSplitView, splitView, setActivePane,
    reopenClosedTab, duplicateTab, addBookmark, removeBookmark, isBookmarked
  } = useTabsStore();
  const { toggle: toggleAI, open: openAI, isOpen: isAIOpen } = useAIStore();
  const { isRunning: isAgentRunning } = useAgentStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  // App mode - check localStorage for saved preference, default to browser
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem("vyber-app-mode");
    return (saved === "os" ? "os" : "browser") as AppMode;
  });

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Save mode preference
  const toggleAppMode = () => {
    const newMode = appMode === "browser" ? "os" : "browser";
    setAppMode(newMode);
    localStorage.setItem("vyber-app-mode", newMode);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd+,: Open settings
      if (isMeta && e.key === ",") {
        e.preventDefault();
        setIsSettingsOpen(true);
        return;
      }

      // Cmd+Shift+K: Toggle AI command palette
      if (isMeta && e.shiftKey && e.key === "k") {
        e.preventDefault();
        toggleAI();
        return;
      }

      // Cmd+Shift+A: Toggle Agent panel
      if (isMeta && e.shiftKey && e.key === "a") {
        e.preventDefault();
        setIsAgentOpen((prev) => !prev);
        return;
      }

      // Cmd+Shift+S: Toggle split view
      if (isMeta && e.shiftKey && e.key === "s") {
        e.preventDefault();
        toggleSplitView();
        return;
      }

      // Cmd+Shift+T: Reopen closed tab
      if (isMeta && e.shiftKey && e.key === "t") {
        e.preventDefault();
        reopenClosedTab();
        return;
      }

      // Cmd+D: Bookmark current page
      if (isMeta && e.key === "d") {
        e.preventDefault();
        if (activeTab && !activeTab.url.startsWith("vyber://")) {
          if (isBookmarked(activeTab.url)) {
            const bookmark = useTabsStore.getState().bookmarks.find((b) => b.url === activeTab.url);
            if (bookmark) removeBookmark(bookmark.id);
          } else {
            addBookmark({ url: activeTab.url, title: activeTab.title, favicon: activeTab.favicon });
          }
        }
        return;
      }

      // Cmd+[ or Cmd+]: Switch between split panes
      if (splitView.enabled && isMeta && (e.key === "[" || e.key === "]")) {
        e.preventDefault();
        setActivePane(e.key === "[" ? "left" : "right");
        return;
      }

      // Don't process other shortcuts if modals are open
      if (isAIOpen || isSettingsOpen) return;

      // Cmd+T: New tab
      if (isMeta && e.key === "t") {
        e.preventDefault();
        addTab();
      }

      // Cmd+W: Close current tab
      if (isMeta && e.key === "w") {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }

      // Cmd+L: Focus address bar
      if (isMeta && e.key === "l") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
      }

      // Cmd+Shift+D: Duplicate tab
      if (isMeta && e.shiftKey && e.key === "d") {
        e.preventDefault();
        if (activeTabId) {
          duplicateTab(activeTabId);
        }
        return;
      }

      // Cmd+1-9: Switch to tab
      if (isMeta && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          setActiveTab(tabs[index].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addTab, closeTab, activeTabId, tabs, setActiveTab, toggleAI, isAIOpen, isSettingsOpen, toggleSplitView, splitView.enabled, setActivePane, reopenClosedTab, duplicateTab, addBookmark, removeBookmark, isBookmarked, activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (action === "ai") {
      openAI();
    }
    if (action === "newtab") {
      addTab();
    }
    if (action) {
      window.history.replaceState({}, "", "/");
    }
  }, [addTab, openAI]);

  // Render VybeOS mode
  if (appMode === "os") {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center bg-gray-950">
              <div className="text-center">
                <div className="mb-4 flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-vyber-purple via-vyber-pink to-vyber-cyan shadow-glow animate-pulse">
                  <span className="text-3xl">✨</span>
                </div>
                <p className="text-white/70">Loading VybeOS...</p>
              </div>
            </div>
          }
        >
          <VybeOS />
        </Suspense>

        {/* Mode toggle button */}
        <button
          onClick={toggleAppMode}
          className="fixed bottom-6 left-6 z-[10001] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 shadow-lg backdrop-blur-xl transition-all hover:scale-110 hover:bg-white/20"
          title="Switch to Browser Mode"
        >
          <Globe className="h-5 w-5 text-white" />
        </button>

        <ToastViewport />
        <NetworkStatusListener />
      </div>
    );
  }

  // Render Browser mode (default)
  return (
    <div className="flex min-h-[100dvh] h-screen flex-col overflow-hidden bg-background">
      <OfflineBanner />

      {/* Tab Bar */}
      <TabBar />

      {/* Address Bar */}
      <AddressBar />

      {/* Web Content Area */}
      <main className="flex-1 overflow-hidden">
        <WebContent />
      </main>

      {/* AI Command Palette */}
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>

      {/* Settings Modal */}
      <Suspense fallback={null}>
        <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </Suspense>

      {/* Agent Panel */}
      <Suspense fallback={null}>
        <AgentPanel isOpen={isAgentOpen} onClose={() => setIsAgentOpen(false)} />
      </Suspense>

      {/* Agent Toggle Button */}
      <button
        onClick={() => setIsAgentOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 ${
          isAgentRunning
            ? "animate-pulse bg-gradient-to-r from-vyber-purple via-vyber-pink to-vyber-cyan"
            : "bg-gradient-to-r from-vyber-purple to-vyber-pink"
        }`}
        title="Open Agent (Cmd+Shift+A)"
      >
        <Bot className="h-6 w-6 text-white" />
      </button>

      {/* Mode toggle button */}
      <button
        onClick={toggleAppMode}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/80 shadow-lg backdrop-blur-xl transition-all hover:scale-110 hover:bg-secondary"
        title="Switch to Desktop Mode (VybeOS)"
      >
        <Monitor className="h-5 w-5 text-foreground" />
      </button>

      <InstallPrompt />
      <CookieConsent />
      <ToastViewport />
      <NetworkStatusListener />
    </div>
  );
}

export default App;
