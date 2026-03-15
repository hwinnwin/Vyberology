import { FeedbackDialog } from "./FeedbackDialog";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

/**
 * Floating Feedback Button
 * Shows a fixed-position button in the bottom-right corner
 */
export function FeedbackButton() {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <FeedbackDialog
        trigger={
          <Button
            size="sm"
            variant="outline"
            className="rounded-full shadow-md hover:shadow-lg transition-all border-vy-charcoal/20 bg-white/80 backdrop-blur-sm text-vy-charcoal/60 hover:text-vy-charcoal hover:bg-white"
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Feedback
          </Button>
        }
      />
    </div>
  );
}
