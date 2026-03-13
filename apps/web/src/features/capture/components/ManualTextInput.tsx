import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Briefcase, Heart } from "lucide-react";

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
    <div className="rounded-2xl border border-vy-charcoal/[0.08] bg-white/60 backdrop-blur-sm p-6 shadow-vy-card">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-sans text-base font-semibold text-vy-charcoal mb-1">
            Enter Numbers or Ask a Question
          </h3>
          <p className="font-sans text-xs text-vy-charcoal/45">
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
            className="min-h-24 border-vy-charcoal/10 bg-vy-parchment/80 text-vy-charcoal placeholder:text-vy-charcoal/30 resize-none rounded-xl focus:border-vy-gold/50 focus:ring-vy-gold/20"
          />
        </div>
        <Button
          onClick={onSubmit}
          disabled={isProcessing || !value.trim()}
          className="w-full gap-2 bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 hover:shadow-vy-glow rounded-xl h-11 font-sans font-medium transition-all duration-200"
        >
          <Send className="h-4 w-4" />
          {isProcessing ? "Processing..." : "Get Reading"}
        </Button>

        {/* Premium outlook shortcuts */}
        <div className="pt-2 border-t border-vy-charcoal/[0.06]">
          <p className="font-sans text-[11px] text-vy-charcoal/40 text-center mb-3">
            Deep AI-powered outlooks — free preview + premium readings
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/career"
              className="flex items-center justify-center gap-2 rounded-xl border border-vy-charcoal/[0.08] bg-white/50 px-3 py-2.5 font-sans text-sm font-medium text-vy-charcoal/70 hover:border-vy-gold/30 hover:text-vy-charcoal hover:shadow-sm transition-all duration-200 no-underline"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Career Outlook
            </Link>
            <Link
              to="/romance"
              className="flex items-center justify-center gap-2 rounded-xl border border-vy-charcoal/[0.08] bg-white/50 px-3 py-2.5 font-sans text-sm font-medium text-vy-charcoal/70 hover:border-vy-gold/30 hover:text-vy-charcoal hover:shadow-sm transition-all duration-200 no-underline"
            >
              <Heart className="h-3.5 w-3.5" />
              Romance Outlook
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
