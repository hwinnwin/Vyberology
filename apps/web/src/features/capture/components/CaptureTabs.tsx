import { CaptureTimeCard } from "./CaptureTimeCard";

interface CaptureTabsProps {
  onTimeCapture: () => void;
  isProcessing: boolean;
}

export function CaptureTabs({
  onTimeCapture,
  isProcessing
}: CaptureTabsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="text-center text-sm font-sans text-vy-charcoal/50 mb-4">
        Capture the current moment's frequency
      </div>
      <CaptureTimeCard
        onCapture={onTimeCapture}
        isProcessing={isProcessing}
      />
    </div>
  );
}
