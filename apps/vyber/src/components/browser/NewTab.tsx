import { Search, Sparkles, Star, TrendingUp, Layout } from "lucide-react";
import { useRef, useState } from "react";
import { useTabsStore } from "@/stores/tabs";

// Vybe Ecosystem Apps - Full Stack Access
const VYBE_APPS = [
  {
    name: "Vybe Player",
    description: "Music & Audio",
    url: "vyber://player",
    icon: "🎵",
    color: "from-vyber-purple to-vyber-pink",
    featured: true,
    category: "media",
  },
  {
    name: "Vyberology",
    description: "Numerology Readings",
    url: "https://vyberology.app",
    icon: "🔮",
    color: "from-purple-500 to-pink-500",
    featured: true,
    category: "core",
  },
  {
    name: "Lumen Orca",
    description: "AI Analysis Engine",
    url: "https://lumenorca.app",
    icon: "🐋",
    color: "from-blue-600 to-cyan-500",
    featured: true,
    category: "ai",
  },
  {
    name: "HwinNwin",
    description: "Success Coaching",
    url: "https://hwinnwin.com",
    icon: "🏆",
    color: "from-amber-500 to-yellow-500",
    category: "coaching",
  },
  {
    name: "Lumynalysis",
    description: "Deep Insights",
    url: "https://lumynalysis.app",
    icon: "🔬",
    color: "from-emerald-500 to-teal-500",
    category: "ai",
  },
  {
    name: "Lumen Flow",
    description: "Workflow Automation",
    url: "https://lumenflow.app",
    icon: "🌊",
    color: "from-sky-500 to-blue-600",
    category: "productivity",
  },
  {
    name: "Numerology",
    description: "Life Path Calculator",
    url: "https://vyberology.app/numerology",
    icon: "🔢",
    color: "from-indigo-500 to-purple-500",
    category: "core",
  },
  {
    name: "Compatibility",
    description: "Match Analysis",
    url: "https://vyberology.app/compatibility",
    icon: "💕",
    color: "from-pink-500 to-rose-500",
    category: "core",
  },
  {
    name: "Hey Lumen",
    description: "Voice Assistant",
    url: "https://vyberology.app/get-vybe",
    icon: "🎙️",
    color: "from-cyan-500 to-blue-500",
    category: "ai",
  },
  {
    name: "Brand",
    description: "Vybe Identity",
    url: "https://vyberology.app/brand",
    icon: "✨",
    color: "from-amber-500 to-orange-500",
    category: "core",
  },
];

// Language Learning Platforms (to be consolidated)
const LANGUAGE_APPS = [
  {
    name: "Langwage",
    description: "Multi-Language Learning",
    url: "https://langwage.app",
    icon: "🌍",
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "FnF Language",
    description: "Fun & Fast Learning",
    url: "https://fnflanguage.app",
    icon: "🎮",
    color: "from-orange-500 to-red-500",
  },
  {
    name: "Ledeedee",
    description: "Interactive Lessons",
    url: "https://ledeedee.app",
    icon: "🎵",
    color: "from-violet-500 to-purple-500",
  },
];

// Quick access to popular sites
const QUICK_LINKS = [
  { name: "Google", url: "https://google.com", icon: "🔍" },
  { name: "YouTube", url: "https://youtube.com", icon: "▶️" },
  { name: "GitHub", url: "https://github.com", icon: "🐙" },
  { name: "Twitter", url: "https://x.com", icon: "𝕏" },
  { name: "Reddit", url: "https://reddit.com", icon: "🤖" },
  { name: "ChatGPT", url: "https://chat.openai.com", icon: "🧠" },
];

export function NewTab() {
  const { activeTabId, navigate } = useTabsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (activeTabId && searchQuery.trim()) {
      navigate(activeTabId, searchQuery);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 sm:px-8">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-vyber-purple via-vyber-pink to-vyber-cyan shadow-glow">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="gradient-text text-4xl font-bold tracking-tight">
            THE VYBER
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered browsing experience
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-12 w-full max-w-2xl">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/50 p-2 pl-4 shadow-lg transition-all focus-within:border-vyber-purple focus-within:ring-4 focus-within:ring-vyber-purple/10">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent py-2 text-lg outline-none placeholder:text-muted-foreground"
            placeholder="Search the web or ask AI anything..."
            aria-label="Search the web"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
          <button
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-vyber-purple to-vyber-pink px-4 py-2 font-medium text-white transition-transform hover:scale-105"
            onClick={handleSearch}
          >
            <Sparkles className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      {/* Vybe Apps Hub */}
      <div className="w-full max-w-4xl">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Layout className="h-4 w-4" /> Vybe Ecosystem
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {VYBE_APPS.map((app) => (
            <button
              key={app.url}
              className={`group relative flex flex-col items-center gap-2 rounded-2xl border border-border bg-secondary/30 p-4 transition-all hover:border-vyber-purple/50 hover:bg-secondary hover:shadow-glow ${app.featured ? 'ring-2 ring-vyber-purple/30' : ''}`}
              onClick={() => activeTabId && navigate(activeTabId, app.url)}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} shadow-lg transition-transform group-hover:scale-110`}>
                <span className="text-xl">{app.icon}</span>
              </div>
              <div className="text-center">
                <span className="block text-xs font-medium">{app.name}</span>
                <span className="block text-[10px] text-muted-foreground">{app.description}</span>
              </div>
              {app.featured && (
                <span className="absolute -right-1 -top-1 rounded-full bg-vyber-purple px-1.5 py-0.5 text-[8px] font-medium text-white">
                  Featured
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Language Learning Section */}
      <div className="mt-6 w-full max-w-4xl">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className="text-base">📚</span> Language Learning
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
          {LANGUAGE_APPS.map((app) => (
            <button
              key={app.url}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-secondary/30 p-4 transition-all hover:border-vyber-purple/50 hover:bg-secondary hover:shadow-glow"
              onClick={() => activeTabId && navigate(activeTabId, app.url)}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} shadow-lg transition-transform group-hover:scale-110`}>
                <span className="text-xl">{app.icon}</span>
              </div>
              <div className="text-center">
                <span className="block text-xs font-medium">{app.name}</span>
                <span className="block text-[10px] text-muted-foreground">{app.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 w-full max-w-3xl">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Star className="h-4 w-4" /> Quick Links
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.url}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary/30 p-3 transition-all hover:border-vyber-purple/50 hover:bg-secondary hover:shadow-glow"
              onClick={() => activeTabId && navigate(activeTabId, link.url)}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-xs text-muted-foreground">{link.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="mt-12 w-full max-w-2xl">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TrendingUp className="h-4 w-4" /> Try asking Vyber AI
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            "Summarize my open tabs",
            "Find that article about React",
            "What's happening in tech today?",
            "Help me research flights to Tokyo",
          ].map((suggestion) => (
            <button
              key={suggestion}
              className="rounded-full border border-border bg-secondary/30 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-vyber-purple/50 hover:text-foreground"
              onClick={() => {
                setSearchQuery(suggestion);
                inputRef.current?.focus();
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-xs text-muted-foreground/50">
        Powered by Claude AI • thevybe.global
      </div>
    </div>
  );
}
