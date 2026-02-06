import { Plus } from "lucide-react";
import { Tab } from "./Tab";
import { useTabsStore } from "@/stores/tabs";
import { cn } from "@/lib/utils";

export function TabBar() {
  const { tabs, activeTabId, addTab, closeTab, setActiveTab } = useTabsStore();

  return (
    <div className="titlebar flex h-10 items-end gap-0.5 bg-secondary/30 px-2 pt-1">
      {/* Tabs */}
      <div className="flex items-end gap-0.5 overflow-x-auto" role="tablist" aria-label="Tabs">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSelect={() => setActiveTab(tab.id)}
            onClose={() => closeTab(tab.id)}
          />
        ))}
      </div>

      {/* New Tab Button */}
      <button
        className={cn(
          "titlebar-button mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
          "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
        onClick={() => addTab()}
        title="New Tab (Cmd+T)"
        aria-label="New tab"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Spacer for window controls on macOS */}
      <div className="ml-auto w-20" />
    </div>
  );
}
