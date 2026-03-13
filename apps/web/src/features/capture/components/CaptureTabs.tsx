import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Edit3, Sparkles } from "lucide-react";
import { CaptureTimeCard } from "./CaptureTimeCard";
import { ManualTextInput } from "./ManualTextInput";
import { LumenChat, ChatMessage } from "./LumenChat";

interface CaptureTabsProps {
  // Time capture
  onTimeCapture: () => void;

  // Manual input
  textValue: string;
  onTextChange: (value: string) => void;
  onTextSubmit: () => void;

  // Lumen chat
  chatMessages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onChatSend: () => void;

  // Shared state
  isProcessing: boolean;
}

export function CaptureTabs({
  onTimeCapture,
  textValue,
  onTextChange,
  onTextSubmit,
  chatMessages,
  chatInput,
  onChatInputChange,
  onChatSend,
  isProcessing
}: CaptureTabsProps) {
  return (
    <Tabs defaultValue="time" className="w-full max-w-2xl mx-auto">
      <TabsList className="grid w-full grid-cols-3 bg-vy-charcoal/[0.06] border border-vy-charcoal/[0.08] mb-6 rounded-xl h-11">
        <TabsTrigger
          value="time"
          className="gap-2 rounded-lg text-vy-charcoal/60 data-[state=active]:bg-vy-charcoal data-[state=active]:text-vy-parchment data-[state=active]:shadow-vy-soft transition-all duration-200"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">Now</span>
        </TabsTrigger>
        <TabsTrigger
          value="manual"
          className="gap-2 rounded-lg text-vy-charcoal/60 data-[state=active]:bg-vy-charcoal data-[state=active]:text-vy-parchment data-[state=active]:shadow-vy-soft transition-all duration-200"
        >
          <Edit3 className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">Advanced</span>
        </TabsTrigger>
        <TabsTrigger
          value="lumen"
          className="gap-2 rounded-lg text-vy-charcoal/60 data-[state=active]:bg-vy-charcoal data-[state=active]:text-vy-parchment data-[state=active]:shadow-vy-soft transition-all duration-200"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">Lumyn</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="time" className="space-y-4">
        <div className="text-center text-sm font-sans text-vy-charcoal/50 mb-4">
          Capture the current moment's frequency
        </div>
        <CaptureTimeCard
          onCapture={onTimeCapture}
          isProcessing={isProcessing}
        />
      </TabsContent>

      <TabsContent value="manual" className="space-y-4">
        <div className="text-center text-sm font-sans text-vy-charcoal/50 mb-4">
          Enter numbers or ask a question
        </div>
        <ManualTextInput
          value={textValue}
          onChange={onTextChange}
          onSubmit={onTextSubmit}
          isProcessing={isProcessing}
        />
      </TabsContent>

      <TabsContent value="lumen" className="space-y-4">
        <div className="text-center text-sm font-sans text-vy-charcoal/50 mb-4">
          Ask Lumyn for personalized guidance
        </div>
        <LumenChat
          messages={chatMessages}
          inputValue={chatInput}
          onInputChange={onChatInputChange}
          onSend={onChatSend}
          isProcessing={isProcessing}
        />
      </TabsContent>
    </Tabs>
  );
}
