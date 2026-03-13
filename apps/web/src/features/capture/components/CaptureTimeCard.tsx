import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import vybeLogo from "@/assets/vybe-logo.png";

interface CaptureTimeCardProps {
  onCapture: () => void;
  isProcessing: boolean;
}

export function CaptureTimeCard({ onCapture, isProcessing }: CaptureTimeCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-vy-charcoal/[0.08] bg-white/60 backdrop-blur-sm p-8 text-center shadow-vy-card">
      <div className="mb-4 flex items-center justify-center gap-3">
        <Clock className="h-7 w-7 text-vy-gold" />
        <span className="font-display text-5xl sm:text-6xl font-normal text-vy-charcoal tracking-wide">
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
        </span>
      </div>
      <p className="mb-8 font-sans text-sm text-vy-charcoal/50">
        {currentTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </p>
      <Button
        onClick={onCapture}
        disabled={isProcessing}
        className="relative inline-flex h-auto min-w-[220px] flex-col items-center gap-3 rounded-full bg-vy-charcoal px-8 py-5 font-sans font-semibold text-vy-parchment shadow-vy-card transition-all duration-300 hover:shadow-vy-glow hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-vy-gold/40 disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto"
      >
        {isProcessing ? (
          <span className="text-base">Capturing...</span>
        ) : (
          <>
            <span className="text-base">What's the</span>
            <span className="relative grid place-items-center rounded-full bg-vy-parchment p-3 shadow-vy-soft">
              <span className="absolute inset-0 rounded-full bg-vy-gold/25 animate-ping" style={{ animationDuration: '2.5s' }}></span>
              <img src={vybeLogo} alt="Vybe" className="h-10 w-10 relative z-10" />
            </span>
          </>
        )}
      </Button>
    </div>
  );
}
