import { useState, useEffect } from "react";
import { ArrowLeft, Home, Clock, Hash, Image as ImageIcon, Trash2, Calendar, TrendingUp, Sparkles, Eye } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  getReadingHistory,
  getRecurringPatterns,
  deleteReading,
  clearHistory,
  type HistoricalReading,
} from "@/lib/readingHistory";
import { getUserReadings, type ReadingRow } from "@/services/readings";
import { TIER_BADGE, type ReadingTier } from "@/lib/tiers";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Footer } from "@/components/Footer";

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [readings, setReadings] = useState<HistoricalReading[]>([]);
  const [serverReadings, setServerReadings] = useState<ReadingRow[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<{ pattern: string; count: number }[]>([]);
  const [selectedReading, setSelectedReading] = useState<HistoricalReading | null>(null);

  useEffect(() => {
    loadHistory();
    if (user) {
      getUserReadings().then(setServerReadings).catch(() => {});
    }
  }, [user]);

  const loadHistory = () => {
    const history = getReadingHistory();
    setReadings(history);
    const patterns = getRecurringPatterns();
    setRecurringPatterns(patterns.slice(0, 8));
  };

  const handleDeleteReading = (id: string) => {
    deleteReading(id);
    loadHistory();
    setSelectedReading(null);
    toast({
      title: "Reading deleted",
      description: "The reading has been removed from your history",
    });
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all reading history? This cannot be undone.")) {
      clearHistory();
      loadHistory();
      setSelectedReading(null);
      toast({
        title: "History cleared",
        description: "All readings have been removed",
      });
    }
  };

  const getInputIcon = (type: HistoricalReading['inputType']) => {
    switch (type) {
      case 'time':
        return <Clock className="h-4 w-4" />;
      case 'pattern':
        return <Sparkles className="h-4 w-4" />;
      case 'manual':
        return <Hash className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-vy-parchment grain">
      {/* Nav */}
      <nav className="max-w-[720px] mx-auto w-full flex justify-between items-center px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Link
          to="/vybe"
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors no-underline"
        >
          <Home size={16} /> Home
        </Link>
      </nav>

      {/* Header */}
      <header className="text-center px-6 pt-10 pb-6">
        <p className="vy-label text-vy-gold mb-4">Your Journey</p>
        <h1 className="vy-display text-[clamp(28px,6vw,40px)] text-vy-charcoal mb-3">
          Reading History
        </h1>
        <div className="vy-divider max-w-[80px] mx-auto mb-3" />
        <p className="font-sans text-sm text-vy-charcoal/50">
          Track patterns and revisit past readings
        </p>
      </header>

      {/* Server-side Readings (paid) */}
      {serverReadings.length > 0 && (
        <section className="max-w-[720px] mx-auto px-6 pb-8 w-full">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-vy-charcoal/50 mb-4">
            Your Readings
          </h2>
          <div className="space-y-3">
            {serverReadings.map((r) => {
              const badge = TIER_BADGE[r.tier as ReadingTier] ?? TIER_BADGE.free;
              const nums = r.numerology_numbers as Record<string, { value: number }>;
              const createdDate = new Date(r.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full border border-vy-gold/30 flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-lg font-bold text-vy-charcoal">
                        {nums.lifePath?.value ?? "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-medium text-vy-charcoal truncate">
                        {r.full_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`font-sans text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.text}
                        </span>
                        <span className="font-sans text-xs text-vy-charcoal/40">{createdDate}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/reading/${r.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-medium text-vy-charcoal/60 hover:text-vy-charcoal hover:bg-vy-charcoal/[0.06] transition-all bg-transparent border-none cursor-pointer"
                  >
                    <Eye size={14} /> View
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Divider between sections */}
      {serverReadings.length > 0 && readings.length > 0 && (
        <div className="vy-divider max-w-[600px] mx-auto mb-8" />
      )}

      {/* Local Reading History (vybe captures) */}
      <div className="max-w-[720px] mx-auto px-6 pb-8 w-full">
        {/* Recurring Patterns */}
        {recurringPatterns.length > 0 && (
          <div className="mb-8 p-6 rounded-2xl border border-vy-gold/20 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-vy-gold" />
              <h3 className="font-display text-lg font-semibold text-vy-charcoal">Recurring Patterns</h3>
            </div>
            <p className="font-sans text-xs text-vy-charcoal/50 mb-4">
              Numbers appearing most frequently — strong messages from the universe
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recurringPatterns.map(({ pattern, count }) => (
                <div
                  key={pattern}
                  className="text-center p-3 rounded-xl border border-vy-charcoal/[0.08] bg-white/50"
                >
                  <div className="font-display text-xl font-bold text-vy-charcoal">{pattern}</div>
                  <div className="font-sans text-xs text-vy-charcoal/40 mt-1">
                    {count} time{count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Reading List */}
          <div className="lg:col-span-1">
            <div className="p-5 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-sm font-semibold text-vy-charcoal">
                  Vybe Captures ({readings.length})
                </h2>
                {readings.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-red-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {readings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-10 w-10 text-vy-charcoal/20 mx-auto mb-3" />
                  <p className="font-sans text-sm text-vy-charcoal/40">No captures yet</p>
                  <p className="font-sans text-xs text-vy-charcoal/30 mt-1">
                    Capture your first vybe to start your log
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {readings.map((reading) => (
                    <button
                      key={reading.id}
                      onClick={() => setSelectedReading(reading)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer bg-transparent ${
                        selectedReading?.id === reading.id
                          ? 'border-vy-gold/40 bg-vy-gold/[0.05]'
                          : 'border-vy-charcoal/[0.06] hover:border-vy-charcoal/[0.15]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-vy-charcoal/60">
                        {getInputIcon(reading.inputType)}
                        <span className="font-sans text-sm font-medium text-vy-charcoal">
                          {reading.inputValue}
                        </span>
                      </div>
                      <div className="font-sans text-xs text-vy-charcoal/30">
                        {formatDate(reading.timestamp)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reading Detail */}
          <div className="lg:col-span-2">
            {selectedReading ? (
              <div className="p-6 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-vy-charcoal/60">
                      {getInputIcon(selectedReading.inputType)}
                      <h2 className="font-display text-xl font-semibold text-vy-charcoal">
                        {selectedReading.inputValue}
                      </h2>
                    </div>
                    <p className="font-sans text-xs text-vy-charcoal/40">
                      {new Date(selectedReading.timestamp).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteReading(selectedReading.id)}
                    className="text-red-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="whitespace-pre-wrap font-sans text-sm text-vy-charcoal/80 leading-relaxed">
                  {selectedReading.reading}
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm text-center">
                <Sparkles className="h-12 w-12 text-vy-charcoal/15 mx-auto mb-4" />
                <p className="font-sans text-sm text-vy-charcoal/40">
                  Select a capture to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
};

export default History;
