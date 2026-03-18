import { useState, useEffect } from "react";
import { Sparkles, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LumenChat, ChatMessage } from "@/features/capture/components/LumenChat";
import { callLumynChat } from "@/services/lumynApi";
import { buildLumynContext } from "@/lib/lumynContext";
import { useToast } from "@/components/ui/use-toast";

const CHAT_STORAGE_KEY = "vyberology_lumyn_chat";

/**
 * Floating Lumyn chatbot button (bottom-right).
 * Opens an overlay chat panel when clicked.
 */
export function LumynChatFab() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Chat state — persisted to localStorage
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);

  // Persist chat messages
  useEffect(() => {
    try {
      const toStore = chatMessages.slice(-50);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      /* ignore */
    }
  }, [chatMessages]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    const updatedMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: userMessage },
    ];
    setChatMessages(updatedMessages);
    setIsProcessing(true);

    try {
      const inputs = await buildLumynContext(updatedMessages, userMessage);
      const response = await callLumynChat({
        message: userMessage,
        conversationId,
        vyberologyContext: inputs,
      });
      setConversationId(response.conversationId);
      setShowCrisisBanner(response.client_directives.crisis_banner);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.message.content },
      ]);
    } catch (error) {
      toast({
        title: "Chat failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Crisis banner */}
      {isOpen && showCrisisBanner && (
        <div className="fixed bottom-[calc(100vh-12rem)] right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px]">
          <div className="flex items-start gap-2 rounded-lg bg-red-950 border border-red-700 px-4 py-3 text-red-200 text-sm shadow-lg">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
            <span>
              If you're in crisis, please reach out — <strong>Lifeline: 13 11 14</strong> (24/7) or <strong>Emergency: 000</strong>.
            </span>
            <button onClick={() => setShowCrisisBanner(false)} className="ml-auto shrink-0 text-red-400 hover:text-red-200">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Chat panel overlay */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px]">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-vy-charcoal text-vy-parchment flex items-center justify-center shadow-lg hover:bg-vy-charcoal/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <LumenChat
              messages={chatMessages}
              inputValue={chatInput}
              onInputChange={setChatInput}
              onSend={handleSend}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      )}

      {/* FAB button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`rounded-full shadow-lg hover:shadow-xl transition-all w-14 h-14 p-0 ${
            isOpen
              ? "bg-vy-charcoal hover:bg-vy-charcoal/90"
              : "bg-gradient-to-r from-vy-gold to-amber-500 hover:from-vy-gold/90 hover:to-amber-500/90"
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-vy-parchment" />
          ) : (
            <Sparkles className="w-6 h-6 text-white" />
          )}
        </Button>
        {!isOpen && (
          <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-vy-gold animate-pulse" />
        )}
      </div>
    </>
  );
}
