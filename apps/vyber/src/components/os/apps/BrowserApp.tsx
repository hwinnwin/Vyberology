import { TabBar } from "@/components/browser/TabBar";
import { AddressBar } from "@/components/browser/AddressBar";
import { WebContent } from "@/components/browser/WebContent";

/**
 * BrowserApp - THE VYBER browser running as a windowed app in VybeOS
 * This wraps the existing browser components for use in the OS window manager
 */
export function BrowserApp() {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab Bar */}
      <TabBar />

      {/* Address Bar */}
      <AddressBar />

      {/* Web Content */}
      <div className="flex-1 overflow-hidden">
        <WebContent />
      </div>
    </div>
  );
}
