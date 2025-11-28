import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ManualTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export function ManualTextInput({ 
  value, 
  onChange, 
  onSubmit, 
  isProcessing 
}: ManualTextInputProps) {
  return (
    <Card className="w-full max-w-2xl border-lf-violet/30 bg-lf-ink/60 p-6 backdrop-blur">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Enter Numbers or Ask a Question
          </h3>
          <p className="text-sm text-lf-slate">
            Type numbers (11:11, 222, etc.) or ask about your vybe
          </p>
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="Enter numbers or ask a question... (e.g., 11:11, 222, or 'What does 333 mean?')"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            disabled={isProcessing}
            className="min-h-24 border-lf-violet/30 bg-lf-midnight/50 text-white placeholder:text-lf-slate resize-none"
          />
        </div>
        <Button
          onClick={onSubmit}
          disabled={isProcessing || !value.trim()}
          className="w-full gap-2 bg-lf-gradient hover:shadow-glow"
        >
          <Send className="h-4 w-4" />
          {isProcessing ? "Processing..." : "Get Reading"}
        </Button>
      </div>
    </Card>
  );
}
