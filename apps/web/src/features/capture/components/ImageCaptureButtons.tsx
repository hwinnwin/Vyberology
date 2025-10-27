import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon } from "lucide-react";

interface ImageCaptureButtonsProps {
  onCameraCapture: () => void;
  onPickPhoto: () => void;
  isProcessing: boolean;
  isInCooldown: boolean;
  processingStep?: string;
}

export function ImageCaptureButtons({
  onCameraCapture,
  onPickPhoto,
  isProcessing,
  isInCooldown,
  processingStep
}: ImageCaptureButtonsProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Processing Step Indicator */}
      {processingStep && (
        <div className="text-sm text-lf-aurora animate-pulse">
          {processingStep}
        </div>
      )}

      {/* Cooldown Message */}
      {isInCooldown && !isProcessing && (
        <div className="text-sm text-lf-violet">
          Please wait before trying again...
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={onCameraCapture}
          disabled={isProcessing || isInCooldown}
          variant="outline"
          className="gap-2 border-lf-aurora text-lf-aurora hover:bg-lf-aurora/10 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          <Camera className="h-5 w-5" />
          {isInCooldown ? "Wait..." : "Take Photo"}
        </Button>
        <Button
          onClick={onPickPhoto}
          disabled={isProcessing || isInCooldown}
          variant="outline"
          className="gap-2 border-lf-violet text-lf-violet hover:bg-lf-violet/10 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          <ImageIcon className="h-5 w-5" />
          {isInCooldown ? "Wait..." : "Choose Image"}
        </Button>
      </div>
    </div>
  );
}
