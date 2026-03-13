import { FeedbackDialog } from "./FeedbackDialog";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

/**
 * Floating Feedback Button
 * Shows a fixed-position button in the bottom-right corner
 */
export function FeedbackButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <FeedbackDialog
        trigger={
          <Button
            size="lg"
            className="rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Feedback
          </Button>
        }
      />
    </div>
  );
}
