import { create } from "zustand";
import { toast } from "@/lib/toast";
import { createRateLimiter } from "@/lib/rateLimit";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "search";
  content: string;
  timestamp: number;
  searchResults?: SearchResult[];
}

export interface AIState {
  isOpen: boolean;
  isLoading: boolean;
  isSearching: boolean;
  messages: AIMessage[];
  currentInput: string;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setInput: (input: string) => void;
  sendMessage: (content: string) => Promise<void>;
  searchWeb: (query: string) => Promise<SearchResult[]>;
  clearMessages: () => void;
}

const CLAUDE_SYSTEM_PROMPT = `You are THE VYBER's AI assistant - an intelligent browser companion similar to Perplexity AI. You help users:

1. **Search & Research** - Search the web and synthesize information from multiple sources
2. **Navigate** - Understand natural language requests like "open my email" or "search for flights to Tokyo"
3. **Summarize** - Provide concise summaries of web pages and search results
4. **Answer Questions** - Use web search results to provide accurate, up-to-date information

When given search results, use them to provide accurate, cited responses. Format citations as [1], [2], etc.
Keep responses concise and actionable. When suggesting navigation, provide the URL.

Current context: User is browsing in THE VYBER browser with web search capabilities.`;

const rateLimiter = createRateLimiter({ max: 30, windowMs: 60_000 }); // More generous limit
const AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL as string | undefined;
const ALLOW_BROWSER_KEY = (import.meta.env.VITE_ALLOW_BROWSER_AI_KEY as string | undefined) === "true";
const AI_MODEL = (import.meta.env.VITE_CLAUDE_MODEL as string | undefined) || "claude-sonnet-4-20250514";

function getApiKey() {
  const storedKey = localStorage.getItem("vyber_claude_api_key");
  if (storedKey) return storedKey;
  if (ALLOW_BROWSER_KEY) return import.meta.env.VITE_CLAUDE_API_KEY as string | undefined;
  return undefined;
}

function getEndpoint() {
  if (AI_PROXY_URL) return AI_PROXY_URL;
  if (import.meta.env.PROD) return "/.netlify/functions/claude-proxy";
  return "";
}

function getSearchEndpoint() {
  if (import.meta.env.PROD) return "/.netlify/functions/web-search";
  return "";
}

// Detect if query is a search/research question
function shouldSearch(query: string): boolean {
  const searchIndicators = [
    "search", "find", "look up", "what is", "who is", "when did", "where is",
    "how to", "why did", "latest", "news", "current", "today", "recent",
    "price of", "weather", "stock", "define", "explain", "tell me about",
    "?", "research", "compare", "best", "top", "review"
  ];
  const lowerQuery = query.toLowerCase();
  return searchIndicators.some(indicator => lowerQuery.includes(indicator));
}

export const useAIStore = create<AIState>((set, get) => ({
  isOpen: false,
  isLoading: false,
  isSearching: false,
  messages: [],
  currentInput: "",

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  setInput: (input: string) => set({ currentInput: input }),

  searchWeb: async (query: string): Promise<SearchResult[]> => {
    const endpoint = getSearchEndpoint();
    if (!endpoint) {
      // In development, return mock results
      return [{
        title: `Search: ${query}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        snippet: "Web search available in production mode.",
      }];
    }

    try {
      set({ isSearching: true });
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Search error:", error);
      return [];
    } finally {
      set({ isSearching: false });
    }
  },

  sendMessage: async (content: string) => {
    if (!rateLimiter()) {
      toast("AI rate limit reached. Please wait and try again.", { variant: "warning" });
      return;
    }

    if (!navigator.onLine) {
      toast("You're offline. We'll retry when the connection returns.", {
        variant: "warning",
      });
    }

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      currentInput: "",
      isLoading: true,
    }));

    try {
      // Check if we should search first
      let searchResults: SearchResult[] = [];
      let searchContext = "";

      if (shouldSearch(content)) {
        set({ isSearching: true });
        searchResults = await get().searchWeb(content);
        set({ isSearching: false });

        if (searchResults.length > 0) {
          // Add search results as a message
          const searchMessage: AIMessage = {
            id: `search-${Date.now()}`,
            role: "search",
            content: `Found ${searchResults.length} results`,
            timestamp: Date.now(),
            searchResults,
          };
          set((state) => ({
            messages: [...state.messages, searchMessage],
          }));

          // Build context for AI
          searchContext = "\n\nWeb Search Results:\n" + searchResults.map((r, i) =>
            `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`
          ).join("\n\n");
        }
      }

      const endpoint = getEndpoint();
      const apiKey = getApiKey();

      if (!endpoint && !apiKey) {
        const errorMessage: AIMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content:
            "Please set your Claude API key in settings (Cmd+,) or deploy to Netlify with ANTHROPIC_API_KEY to use AI features.",
          timestamp: Date.now(),
        };
        set((state) => ({
          messages: [...state.messages, errorMessage],
          isLoading: false,
        }));
        return;
      }

      const useProxy = Boolean(endpoint);
      const url = useProxy ? endpoint : "https://api.anthropic.com/v1/messages";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (!useProxy && apiKey) {
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        headers["anthropic-dangerous-direct-browser-access"] = "true";
      }

      // Build messages for context
      const recentMessages = get().messages
        .filter(m => m.role !== "search")
        .slice(-12)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // Add search context to the latest user message
      if (searchContext && recentMessages.length > 0) {
        const lastMsg = recentMessages[recentMessages.length - 1];
        lastMsg.content = lastMsg.content + searchContext;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 2048,
          system: CLAUDE_SYSTEM_PROMPT,
          messages: recentMessages,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorText = data?.error?.message || data?.error || `API error: ${response.status}`;
        throw new Error(errorText);
      }

      const assistantContent = data.content?.[0]?.text || "I couldn't process that request.";

      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: assistantContent,
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      console.error("AI request failed:", error);
      toast("AI request failed. Please try again.", { variant: "error" });
      const errorMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
