import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2, Copy, Check, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "What can you help me with?",
  "Summarize my recent browsing",
  "Create a new project plan",
  "Explain numerology basics",
  "What are the sacred frequencies?",
];

export function AIAssistantApp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm Lumen, your AI assistant in VybeOS. I can help you with:\n\n• Browsing assistance and page summaries\n• Writing and editing content\n• Answering questions\n• Task automation\n• Exploring the Vybe ecosystem\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (in real app, this would call Claude API)
    setTimeout(() => {
      const responses: Record<string, string> = {
        "what can you help me with": "I can assist you with a wide range of tasks:\n\n**Browsing**\n• Summarize web pages\n• Extract key information\n• Find related content\n\n**Writing**\n• Draft emails and documents\n• Edit and improve text\n• Generate creative content\n\n**Productivity**\n• Create task lists\n• Set reminders\n• Organize information\n\n**Vybe Ecosystem**\n• Navigate Vybe apps\n• Explain features\n• Provide guidance\n\nJust ask me anything!",
        "what are the sacred frequencies": "The sacred frequencies in the Vybe ecosystem are:\n\n**0616** - Operating System (Reset)\nThe foundation frequency, representing new beginnings and system resets.\n\n**0626** - Partnership Frequency\nThe frequency of collaboration and aligned partnerships.\n\n**224** - Stewardship\nRepresents responsible guidance and caretaking.\n\n**369** - Tesla's Key\nNikola Tesla believed these numbers held the key to the universe.\n\n**1111** - Authority\nRepresents alignment, awakening, and manifestation.\n\n**528** - Love Frequency\nKnown as the \"miracle tone\" for transformation and DNA repair.\n\nThese frequencies guide the design principles of VybeOS and the entire Vybe ecosystem.",
        default: "I understand you're asking about that. Let me help you.\n\nIn VybeOS, I can assist with various tasks including browsing, writing, and exploring the Vybe ecosystem. While I'm currently running in demo mode, the full version connects to Claude AI for comprehensive assistance.\n\nIs there something specific you'd like to explore?",
      };

      const lowerInput = userMessage.content.toLowerCase();
      let response = responses.default;

      for (const [key, value] of Object.entries(responses)) {
        if (key !== "default" && lowerInput.includes(key)) {
          response = value;
          break;
        }
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  }, [input, isLoading]);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Copy message
  const copyMessage = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared. How can I help you?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Handle suggestion click
  const handleSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-vyber-purple to-vyber-pink">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Lumen AI</h2>
            <p className="text-xs text-white/50">Your intelligent assistant</p>
          </div>
        </div>
        <button
          className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          onClick={clearChat}
          title="Clear chat"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  message.role === "assistant"
                    ? "bg-gradient-to-br from-vyber-purple to-vyber-pink"
                    : "bg-white/20"
                }`}
              >
                {message.role === "assistant" ? (
                  <Bot className="h-4 w-4 text-white" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Content */}
              <div
                className={`group relative max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "assistant"
                    ? "bg-white/10"
                    : "bg-vyber-purple/30"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <p className="mt-2 text-xs text-white/30">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>

                {/* Copy button */}
                <button
                  className="absolute -right-2 -top-2 rounded-lg bg-gray-800 p-1.5 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                  onClick={() => copyMessage(message.id, message.content)}
                >
                  {copiedId === message.id ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-white/50" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-vyber-purple to-vyber-pink">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/50" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/50 [animation-delay:0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/50 [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="border-t border-white/10 px-4 py-3">
          <p className="mb-2 text-xs text-white/40">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs transition-colors hover:bg-white/10"
                onClick={() => handleSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl bg-white/10 p-2">
            <textarea
              ref={inputRef}
              className="max-h-[150px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-white/30"
              placeholder="Ask Lumen anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
            />
            <button
              className={`rounded-xl p-2.5 transition-colors ${
                input.trim() && !isLoading
                  ? "bg-vyber-purple text-white hover:bg-vyber-purple/80"
                  : "bg-white/10 text-white/30"
              }`}
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-white/30">
            Lumen can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}
