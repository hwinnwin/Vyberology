import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Card className="border-lf-aurora/30 bg-lf-gradient p-8 text-center shadow-glow">
      <div className="mb-4 flex items-center justify-center gap-3">
        <Clock className="h-8 w-8 text-white" />
        <span className="font-display text-6xl font-bold text-white">
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
        </span>
      </div>
      <p className="mb-6 text-white/80">
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
        className="relative inline-flex h-auto min-w-[220px] flex-col items-center gap-3 rounded-full bg-white px-6 py-5 font-semibold text-lf-indigo shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-lf-aurora disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto animate-pulse"
        style={{ animationDuration: '3s' }}
      >
        {isProcessing ? (
          <span className="text-lg">Capturing...</span>
        ) : (
          <>
            <span className="text-lg">What's the</span>
            <span className="relative grid place-items-center rounded-full bg-white p-3 shadow-lg ring-2 ring-lf-violet/30">
              {/* Oscillating rings */}
              <span className="absolute inset-0 rounded-full bg-lf-violet/20 animate-ping" style={{ animationDuration: '2s' }}></span>
              <span className="absolute inset-0 rounded-full bg-lf-aurora/20 animate-pulse" style={{ animationDuration: '3s' }}></span>
              <img src={vybeLogo} alt="Vybe" className="h-12 w-12 relative z-10" />
            </span>
          </>
        )}
      </Button>
    </Card>
  );
}
