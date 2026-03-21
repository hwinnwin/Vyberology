import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { ReadingRenderer } from "@/components/ReadingRenderer";
import type { SpeechInputState } from "@/hooks/useSpeechInput";
import type { TtsState } from "@/services/lumynTts";

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
  // Voice input
  speechState?: SpeechInputState;
  onMicClick?: (currentInput: string) => void;
  // TTS output
  ttsMessageIndex?: number | null;
  ttsState?: TtsState;
  onSpeakMessage?: (index: number, content: string) => void;
}

export function LumenChat({
  messages,
  inputValue,
  onInputChange,
  onSend,
  isProcessing,
  speechState = 'unsupported',
  onMicClick,
  ttsMessageIndex,
  ttsState = 'idle',
  onSpeakMessage,
}: LumenChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const isListening = speechState === 'listening';
  const micSupported = speechState !== 'unsupported';

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
            <div key={idx} className="group relative">
              <div
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

              {/* Speaker button — assistant messages only */}
              {msg.role === "assistant" && msg.content && onSpeakMessage && (
                <button
                  onClick={() => onSpeakMessage(idx, msg.content)}
                  className={`absolute -bottom-1 right-7 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center ${
                    ttsMessageIndex === idx && ttsState !== 'idle'
                      ? 'bg-vy-gold/20 text-vy-gold opacity-100'
                      : 'bg-vy-charcoal/5 text-vy-charcoal/40 hover:text-vy-charcoal/70'
                  }`}
                  title={ttsMessageIndex === idx && ttsState === 'playing' ? 'Stop' : 'Listen'}
                >
                  {ttsMessageIndex === idx && ttsState === 'loading' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                </button>
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
        <div className="flex gap-2 items-center">
          {/* Mic button */}
          {micSupported && onMicClick && (
            <button
              type="button"
              onClick={() => onMicClick(inputValue)}
              disabled={isProcessing}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg scale-110 animate-pulse'
                  : 'bg-vy-charcoal/8 text-vy-charcoal/50 hover:bg-vy-charcoal/15 hover:text-vy-charcoal disabled:opacity-40'
              }`}
              title={isListening ? 'Stop listening' : 'Speak your message'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          <Input
            placeholder={isListening ? "Listening..." : "Ask Lumyn a question..."}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={isProcessing}
            className={`border-vy-charcoal/10 bg-vy-parchment/80 text-vy-charcoal placeholder:text-vy-charcoal/30 rounded-xl focus:border-vy-gold/50 focus:ring-vy-gold/20 ${
              isListening ? 'border-red-300 ring-1 ring-red-200' : ''
            }`}
          />

          <Button
            onClick={onSend}
            disabled={isProcessing || !inputValue.trim()}
            className="bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 hover:shadow-vy-glow rounded-xl px-4 transition-all duration-200 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {isListening && (
          <p className="text-[10px] text-red-400 mt-1.5 px-1">
            Tap the mic again or press Enter to send
          </p>
        )}
      </div>
    </div>
  );
}
