import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Clock, Hash, Image as ImageIcon, Trash2, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getReadingHistory,
  getRecurringPatterns,
  deleteReading,
  clearHistory,
  type HistoricalReading,
} from "@/lib/readingHistory";
import { useToast } from "@/components/ui/use-toast";

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [readings, setReadings] = useState<HistoricalReading[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<{ pattern: string; count: number }[]>([]);
  const [selectedReading, setSelectedReading] = useState<HistoricalReading | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const history = getReadingHistory();
    setReadings(history);
    const patterns = getRecurringPatterns();
    setRecurringPatterns(patterns.slice(0, 8)); // Top 8 patterns
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
    <div className="min-h-screen bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
      <div className="container mx-auto px-6 py-12">
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="gap-2 text-white hover:text-lf-aurora"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="gap-2 text-white hover:text-lf-aurora"
          >
            <Home className="h-5 w-5" />
            Home
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-8 w-8 text-lf-aurora" />
            <h1 className="font-display text-5xl font-bold text-white">
              Reading History
            </h1>
          </div>
          <p className="text-lf-slate text-lg">
            Your personal frequency log - track patterns and revisit past readings
          </p>
        </div>

        {/* Recurring Patterns */}
        {recurringPatterns.length > 0 && (
          <Card className="mb-8 border-lf-aurora/30 bg-lf-gradient/50 p-6 backdrop-blur shadow-glow">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-lf-aurora" />
              <h3 className="font-display text-xl font-semibold text-white">Recurring Patterns</h3>
            </div>
            <p className="text-sm text-white/80 mb-4">
              Numbers appearing most frequently in your readings - strong messages from the universe
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recurringPatterns.map(({ pattern, count }) => (
                <div
                  key={pattern}
                  className="bg-white/90 rounded-lg p-4 text-center hover:bg-white transition-all hover:scale-105"
                >
                  <div className="text-2xl font-bold text-lf-indigo">{pattern}</div>
                  <div className="text-xs text-lf-slate mt-1">
                    {count} time{count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Reading List */}
          <div className="lg:col-span-1">
            <Card className="border-lf-violet/30 bg-lf-ink/60 p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold text-white">
                  All Readings ({readings.length})
                </h2>
                {readings.length > 0 && (
                  <Button
                    onClick={handleClearAll}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {readings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-lf-violet mx-auto mb-3" />
                  <p className="text-lf-slate">No readings yet</p>
                  <p className="text-sm text-lf-slate/70 mt-1">
                    Capture your first vybe to start your log
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {readings.map((reading) => (
                    <button
                      key={reading.id}
                      onClick={() => setSelectedReading(reading)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedReading?.id === reading.id
                          ? 'border-lf-violet bg-lf-violet/20'
                          : 'border-lf-violet/20 bg-lf-midnight/50 hover:border-lf-violet/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getInputIcon(reading.inputType)}
                        <span className="font-semibold text-white text-sm">
                          {reading.inputValue}
                        </span>
                      </div>
                      <div className="text-xs text-lf-slate">
                        {formatDate(reading.timestamp)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Reading Detail */}
          <div className="lg:col-span-2">
            {selectedReading ? (
              <Card className="border-lf-violet/30 bg-lf-ink/60 p-8 backdrop-blur">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getInputIcon(selectedReading.inputType)}
                      <h2 className="font-display text-2xl font-bold text-white">
                        {selectedReading.inputValue}
                      </h2>
                    </div>
                    <p className="text-sm text-lf-slate">
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
                  <Button
                    onClick={() => handleDeleteReading(selectedReading.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-white leading-relaxed">
                    {selectedReading.reading}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-lf-violet/30 bg-lf-ink/60 p-12 backdrop-blur">
                <div className="text-center">
                  <Sparkles className="h-16 w-16 text-lf-violet mx-auto mb-4 opacity-50" />
                  <p className="text-lf-slate text-lg">
                    Select a reading to view details
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
