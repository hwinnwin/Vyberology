import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { ReadingRenderer } from "@/components/ReadingRenderer";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface LumenChatProps {
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isProcessing: boolean;
}

export function LumenChat({
  messages,
  inputValue,
  onInputChange,
  onSend,
  isProcessing,
}: LumenChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="rounded-2xl border border-vy-charcoal/[0.08] bg-white/60 backdrop-blur-sm shadow-vy-card overflow-hidden flex flex-col"
      style={{ height: 420 }}
    >
      {/* Header */}
      <div className="border-b border-vy-charcoal/[0.06] px-6 py-4">
        <h3 className="font-sans text-base font-semibold text-vy-charcoal">
          Chat with Lumyn
        </h3>
        <p className="font-sans text-xs text-vy-charcoal/45">
          Ask about numbers, patterns, or your spiritual path
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className="w-12 h-12 rounded-full bg-vy-gold/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-vy-gold" />
            </div>
            <p className="font-sans text-sm text-vy-charcoal/40 max-w-[240px]">
              Ask Lumyn anything about numerology, your vybe, or the meaning behind your numbers.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={
                msg.role === "user"
                  ? "ml-10 rounded-2xl rounded-br-md bg-vy-charcoal px-4 py-3 text-vy-parchment"
                  : "mr-6 rounded-2xl rounded-bl-md border border-vy-charcoal/[0.06] bg-vy-parchment/80 px-4 py-3"
              }
            >
              {msg.role === "user" ? (
                <p className="font-sans text-sm">{msg.content}</p>
              ) : (
                <ReadingRenderer text={msg.content} />
              )}
            </div>
          ))
        )}
        {isProcessing && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <div className="mr-6 rounded-2xl rounded-bl-md border border-vy-charcoal/[0.06] bg-vy-parchment/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-vy-charcoal/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-vy-charcoal/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-vy-charcoal/30 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="font-sans text-xs text-vy-charcoal/40">Lumyn is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-vy-charcoal/[0.06] px-4 py-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ask Lumyn a question..."
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={isProcessing}
            className="border-vy-charcoal/10 bg-vy-parchment/80 text-vy-charcoal placeholder:text-vy-charcoal/30 rounded-xl focus:border-vy-gold/50 focus:ring-vy-gold/20"
          />
          <Button
            onClick={onSend}
            disabled={isProcessing || !inputValue.trim()}
            className="bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 hover:shadow-vy-glow rounded-xl px-4 transition-all duration-200"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
