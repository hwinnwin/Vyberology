import { useState, useEffect } from "react";
import { Sparkles, X, AlertTriangle, MessageSquare, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LumenChat, ChatMessage } from "@/features/capture/components/LumenChat";
import { callLumynChat } from "@/services/lumynApi";
import { buildLumynContext } from "@/lib/lumynContext";
import { useToast } from "@/components/ui/use-toast";
import { useLumynEntitlement } from "@/hooks/useLumynEntitlement";
import { LumynThreadList } from "@/components/LumynThreadList";
import { LumynPaywallCard } from "@/components/LumynPaywallCard";
import { supabase } from "@/integrations/supabase/client";
import { isNative } from "@/lib/platform";
import type { LumynConversation } from "@/types/lumyn";

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

  const { isPro, messagesUsed, refetch: refetchEntitlement } = useLumynEntitlement();
  const [showThreadList, setShowThreadList] = useState(false);
  const [paywallHit, setPaywallHit] = useState(false);

  // Persist chat messages
  useEffect(() => {
    try {
      const toStore = chatMessages.slice(-50);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      /* ignore */
    }
  }, [chatMessages]);

  const handleSelectThread = async (conversation: LumynConversation) => {
    setShowThreadList(false);
    setIsProcessing(true);
    try {
      const { data: messages } = await supabase
        .from("lumyn_messages")
        .select("role, content")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (messages) {
        setChatMessages(messages as ChatMessage[]);
      }
      setConversationId(conversation.id);
      setPaywallHit(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewThread = () => {
    setShowThreadList(false);
    setChatMessages([]);
    setConversationId(undefined);
    setShowCrisisBanner(false);
    setPaywallHit(false);
  };

  const handleUpgrade = async () => {
    const { purchaseTier } = await import("@/services/purchase");
    const priceId = import.meta.env.VITE_LUMYN_PRO_PRICE_ID ?? "";
    if (isNative()) {
      alert("Please visit vyberology.com to upgrade to Lumyn Pro.");
      return;
    }
    const result = await purchaseTier("lumyn-pro", { priceId, fullName: "", dob: "" });
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
    } else {
      await refetchEntitlement();
    }
  };

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

    // Add empty assistant message that we'll stream into
    const streamingId = crypto.randomUUID();
    setChatMessages((prev) => [...prev, { role: "assistant", content: "", _streamingId: streamingId } as ChatMessage & { _streamingId: string }]);

    try {
      const inputs = await buildLumynContext(updatedMessages, userMessage);

      await callLumynChat({
        message: userMessage,
        conversationId,
        vyberologyContext: inputs,
        onToken: (token) => {
          setChatMessages((prev) =>
            prev.map((m) =>
              (m as ChatMessage & { _streamingId?: string })._streamingId === streamingId
                ? { ...m, content: m.content + token }
                : m
            )
          );
        },
        onDone: (result) => {
          setConversationId(result.conversationId);
          // Remove _streamingId marker, finalize content
          setChatMessages((prev) =>
            prev.map((m) => {
              if ((m as ChatMessage & { _streamingId?: string })._streamingId !== streamingId) return m;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { _streamingId: _sid, ...clean } = m as ChatMessage & { _streamingId: string };
              return clean;
            })
          );
          if (result.paywall) {
            // Remove the streaming message and show paywall
            setChatMessages((prev) =>
              prev.filter(
                (m) => (m as ChatMessage & { _streamingId?: string })._streamingId !== streamingId
              )
            );
            setPaywallHit(true);
            return;
          }
          setPaywallHit(false);
          setShowCrisisBanner(result.client_directives?.crisis_banner ?? false);
        },
        onError: (error) => {
          // Remove empty streaming message
          setChatMessages((prev) =>
            prev.filter(
              (m) => (m as ChatMessage & { _streamingId?: string })._streamingId !== streamingId
            )
          );
          toast({
            title: "Chat failed",
            description: error,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      setChatMessages((prev) =>
        prev.filter(
          (m) => (m as ChatMessage & { _streamingId?: string })._streamingId !== streamingId
        )
      );
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
            {/* Panel header */}
            <div className="absolute -top-3 right-0 left-0 flex justify-between items-center px-1 z-10">
              {/* Left: thread list + new chat */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowThreadList((prev) => !prev)}
                  className="w-7 h-7 rounded-full bg-vy-charcoal text-vy-parchment flex items-center justify-center shadow-lg hover:bg-vy-charcoal/80 transition-colors"
                  title="Conversations"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNewThread}
                  className="w-7 h-7 rounded-full bg-vy-charcoal text-vy-parchment flex items-center justify-center shadow-lg hover:bg-vy-charcoal/80 transition-colors"
                  title="New conversation"
                >
                  <SquarePen className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Free message counter */}
              {!isPro && (
                <span className="text-[10px] text-vy-charcoal/40 font-sans">
                  {messagesUsed} / 10 free messages
                </span>
              )}

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-vy-charcoal text-vy-parchment flex items-center justify-center shadow-lg hover:bg-vy-charcoal/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <LumenChat
              messages={chatMessages}
              inputValue={chatInput}
              onInputChange={setChatInput}
              onSend={handleSend}
              isProcessing={isProcessing}
            />

            {/* Inline paywall card */}
            {paywallHit && (
              <LumynPaywallCard />
            )}

            {/* Thread list drawer */}
            {showThreadList && (
              <div className="absolute inset-0 z-10 bg-vy-parchment rounded-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-vy-charcoal/10">
                  <span className="text-sm font-semibold text-vy-charcoal">Conversations</span>
                  <button
                    onClick={() => setShowThreadList(false)}
                    className="text-vy-charcoal/40 hover:text-vy-charcoal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <LumynThreadList
                  currentConversationId={conversationId}
                  isPro={isPro}
                  onSelectThread={handleSelectThread}
                  onNewThread={handleNewThread}
                  onUpgrade={handleUpgrade}
                />
              </div>
            )}
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
