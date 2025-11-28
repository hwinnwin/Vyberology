import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Edit3, Camera } from "lucide-react";
import { CaptureTimeCard } from "./CaptureTimeCard";
import { ManualTextInput } from "./ManualTextInput";
import { ImageCaptureButtons } from "./ImageCaptureButtons";

interface CaptureTabsProps {
  // Time capture
  onTimeCapture: () => void;
  
  // Manual input
  textValue: string;
  onTextChange: (value: string) => void;
  onTextSubmit: () => void;
  
  // Image capture
  onCameraCapture: () => void;
  onPickPhoto: () => void;
  processingStep?: string;
  isInCooldown: boolean;
  
  // Shared state
  isProcessing: boolean;
}

export function CaptureTabs({
  onTimeCapture,
  textValue,
  onTextChange,
  onTextSubmit,
  onCameraCapture,
  onPickPhoto,
  processingStep,
  isInCooldown,
  isProcessing
}: CaptureTabsProps) {
  return (
    <Tabs defaultValue="time" className="w-full max-w-2xl mx-auto">
      <TabsList className="grid w-full grid-cols-3 bg-lf-ink/60 border border-lf-violet/30 mb-6">
        <TabsTrigger 
          value="time" 
          className="gap-2 data-[state=active]:bg-lf-gradient data-[state=active]:text-white"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Now</span>
        </TabsTrigger>
        <TabsTrigger 
          value="manual"
          className="gap-2 data-[state=active]:bg-lf-gradient data-[state=active]:text-white"
        >
          <Edit3 className="h-4 w-4" />
          <span className="hidden sm:inline">Manual</span>
        </TabsTrigger>
        <TabsTrigger 
          value="image"
          className="gap-2 data-[state=active]:bg-lf-gradient data-[state=active]:text-white"
        >
          <Camera className="h-4 w-4" />
          <span className="hidden sm:inline">Image</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="time" className="space-y-4">
        <div className="text-center text-sm text-lf-slate mb-4">
          Capture the current moment's frequency
        </div>
        <CaptureTimeCard 
          onCapture={onTimeCapture}
          isProcessing={isProcessing}
        />
      </TabsContent>

      <TabsContent value="manual" className="space-y-4">
        <div className="text-center text-sm text-lf-slate mb-4">
          Enter numbers or ask a question
        </div>
        <ManualTextInput
          value={textValue}
          onChange={onTextChange}
          onSubmit={onTextSubmit}
          isProcessing={isProcessing}
        />
      </TabsContent>

      <TabsContent value="image" className="space-y-4">
        <div className="text-center text-sm text-lf-slate mb-4">
          Scan numbers from photos or screenshots
        </div>
        <ImageCaptureButtons
          onCameraCapture={onCameraCapture}
          onPickPhoto={onPickPhoto}
          isProcessing={isProcessing}
          isInCooldown={isInCooldown}
          processingStep={processingStep}
        />
      </TabsContent>
    </Tabs>
  );
}
