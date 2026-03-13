import { Button } from "./ui/button";
import { Copy, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface ReadingActionsProps {
  readingText: string;
  title?: string;
  className?: string;
}

export function ReadingActions({
  readingText,
  title = "Vyberology Reading",
  className = ""
}: ReadingActionsProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(readingText).catch((error) => {
      void trackAnalyticsEvent("error_occurred", {
        platform: "web",
        scope: "clipboard_copy",
        message: error instanceof Error ? error.message : "unknown",
      });
    });
    toast({
      title: "Copied to clipboard",
      description: "Your reading has been copied"
    });
  };

  const handleShare = async () => {
    void trackAnalyticsEvent("share_clicked", {
      platform: "web",
      method: navigator.share ? "web-share" : "fallback-copy",
    });
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: readingText
        });
      } catch (error) {
        // User cancelled share or share failed
        if (error instanceof Error && error.name !== 'AbortError') {
          handleCopy();
          void trackAnalyticsEvent("error_occurred", {
            platform: "web",
            scope: "navigator_share",
            message: error.message
          });
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
        <Copy className="w-4 h-4 mr-2" />
        Copy
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare} className="flex-1">
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
    </div>
  );
}
