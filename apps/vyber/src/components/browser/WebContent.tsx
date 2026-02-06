import { useEffect, useCallback, useState, useRef, lazy, Suspense } from "react";
import { useTabsStore } from "@/stores/tabs";
import { NewTab } from "./NewTab";
import { Loader2, ExternalLink, Globe, RefreshCw, AlertTriangle } from "lucide-react";
import { isTauri } from "@/lib/platform";
import { SplitView } from "./SplitView";

// Lazy load the Music Player for better initial load performance
const MusicPlayer = lazy(() =>
  import("@/components/pages/MusicPlayer").then((m) => ({ default: m.MusicPlayer }))
);

export function WebContent() {
  const { tabs, activeTabId, updateTab, splitView } = useTabsStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  // All hooks must be called before any early returns (React rules of hooks)
  const [hasOpened, setHasOpened] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Open URL - Tauri uses native webview, PWA uses iframe
  const openUrl = useCallback(async (tabId: string, url: string) => {
    if (!url || url.startsWith("vyber://")) return;

    try {
      setError(null);
      setIframeError(false);

      if (isTauri) {
        // Tauri: use native webview
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("create_tab", { tabId, url });
      }

      let hostname = url;
      try {
        hostname = new URL(url).hostname;
      } catch {
        hostname = url;
      }

      // Update tab state
      updateTab(tabId, {
        ...(isTauri ? { isLoading: false } : {}),
        title: hostname,
      });
      setHasOpened(url);
    } catch (err) {
      console.error("Failed to open URL:", err);
      setError(String(err));
      updateTab(tabId, { isLoading: false });
    }
  }, [updateTab]);

  // Auto-open URL when tab navigates
  useEffect(() => {
    if (!activeTab || !activeTabId) return;
    if (activeTab.url.startsWith("vyber://")) return;
    if (hasOpened === activeTab.url) return;

    const timer = setTimeout(() => {
      if (activeTab.isLoading) {
        openUrl(activeTabId, activeTab.url);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeTab?.url, activeTab?.isLoading, activeTabId, hasOpened, openUrl]);

  // Reset state when URL changes
  useEffect(() => {
    if (activeTab?.url !== hasOpened) {
      setHasOpened(null);
      setError(null);
      setIframeError(false);
    }
  }, [activeTab?.url, hasOpened]);

  // Trigger reload when refresh token changes
  useEffect(() => {
    if (activeTab?.reloadToken) {
      setHasOpened(null);
    }
  }, [activeTab?.reloadToken]);

  // Handle iframe load complete
  const handleIframeLoad = useCallback(() => {
    if (activeTabId && activeTab) {
      updateTab(activeTabId, { isLoading: false });
    }
  }, [activeTabId, activeTab, updateTab]);

  // Handle iframe error (X-Frame-Options / CSP blocked)
  const handleIframeError = useCallback(() => {
    setIframeError(true);
    if (activeTabId) {
      updateTab(activeTabId, { isLoading: false });
    }
  }, [activeTabId, updateTab]);

  // If split view is enabled, render the SplitView component
  if (splitView.enabled) {
    return <SplitView />;
  }

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No tab selected</p>
      </div>
    );
  }

  // Show new tab page for vyber:// URLs
  if (activeTab.url === "vyber://player" || activeTab.url === "vyber://music") {
    return (
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-vyber-purple" />
          </div>
        }
      >
        <MusicPlayer />
      </Suspense>
    );
  }

  if (activeTab.url.startsWith("vyber://")) {
    return <NewTab />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary/20 p-8 text-center" role="alert">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/20">
          <Globe className="h-10 w-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Failed to open page</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {error}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setError(null);
              if (activeTabId) {
                updateTab(activeTabId, { isLoading: true });
                openUrl(activeTabId, activeTab.url);
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={() => window.open(activeTab.url, "_blank", "noopener,noreferrer")}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </button>
        </div>
      </div>
    );
  }

  // PWA Mode: Show iframe for web content
  if (!isTauri && hasOpened === activeTab.url) {
    return (
      <div className="relative h-full w-full web-content">
        {/* Loading overlay */}
        {activeTab.isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-vyber-purple" />
          </div>
        )}

        {/* Iframe blocked warning */}
        {iframeError && (
          <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary/20 p-8 text-center" role="alert">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/20">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold">This site can't be embedded</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                {new URL(activeTab.url).hostname} doesn't allow being displayed in frames.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.open(activeTab.url, "_blank", "noopener,noreferrer")}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-vyber-purple to-vyber-pink px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </button>
            </div>
          </div>
        )}

        {/* Web content iframe */}
        {!iframeError && (
          <iframe
            ref={iframeRef}
            key={`${activeTab.id}-${activeTab.reloadToken}`}
            src={activeTab.url}
            className="h-full w-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
            allow="accelerometer; camera; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={activeTab.title || activeTab.url}
          />
        )}
      </div>
    );
  }

  // Tauri Mode: Show page opened state (content in native webview)
  if (isTauri && hasOpened === activeTab.url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary/20 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-vyber-purple via-vyber-pink to-vyber-cyan shadow-glow">
          <Globe className="h-10 w-10 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Browsing in new window</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {activeTab.url}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => activeTabId && openUrl(activeTabId, activeTab.url)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            Open Again
          </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground/50">
          The page is open in a separate browser window
        </p>
      </div>
    );
  }

  // Show loading state
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-secondary/20 p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-vyber-purple" />
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Loading...</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {activeTab.url}
          </p>
        </div>
      </div>
      <div className="w-full max-w-md animate-pulse space-y-3">
        <div className="h-3 w-3/4 rounded-full bg-secondary/60" />
        <div className="h-3 w-5/6 rounded-full bg-secondary/60" />
        <div className="h-3 w-2/3 rounded-full bg-secondary/60" />
      </div>
    </div>
  );
}
