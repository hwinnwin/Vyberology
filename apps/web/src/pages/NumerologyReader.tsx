import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { ReadingForm } from "@/components/ReadingForm";
import { ReadingCard } from "@/components/ReadingCard";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { saveReading } from "@/lib/readingHistory";
import type { ReadingResult } from "@/lib/numerology";
import { trackAnalyticsEvent } from "@/lib/analytics";

export default function NumerologyReader() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ReadingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (fullName: string, dob: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('read', {
        body: { fullName, dob }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate reading');
      }

      if (!data) {
        throw new Error('No data received from server');
      }

      setResult(data);
      void trackAnalyticsEvent("reading_generated", {
        platform: "web",
        source: "numerology-reader",
      });

      saveReading({
        inputType: 'manual',
        inputValue: `${fullName} (${dob})`,
        reading: JSON.stringify(data),
      });

      toast({
        title: "Success!",
        description: "Your reading has been generated.",
      });
    } catch (error) {
      console.error('Error generating reading:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

      setError(errorMessage);
      void trackAnalyticsEvent("error_occurred", {
        platform: "web",
        scope: "numerology_reader",
        message: errorMessage,
      });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-vy-parchment grain">
      {/* Nav */}
      <nav className="max-w-[720px] mx-auto w-full flex justify-between items-center px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors duration-200 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors duration-200 no-underline"
        >
          <Home size={16} /> Home
        </Link>
      </nav>

      {/* Header */}
      <header className="text-center px-6 pt-12 pb-8">
        <p className="vy-label text-vy-gold mb-4">Core Numbers</p>
        <h1 className="vy-display text-[clamp(36px,7vw,48px)] text-vy-charcoal mb-3">
          Numerology Reading
        </h1>
        <div className="vy-divider max-w-[80px] mx-auto mb-4" />
        <p className="font-sans text-base font-light text-vy-charcoal/50 max-w-[420px] mx-auto">
          Discover your numbers and dominant chakras
        </p>
      </header>

      {/* Form */}
      <section className="max-w-[600px] mx-auto px-6 pb-8">
        <ReadingForm onGenerate={handleGenerate} isLoading={isLoading} />
      </section>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Calculating your numerology..." />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <section className="max-w-[720px] mx-auto px-6 pb-12">
          <ErrorMessage title="Failed to Generate Reading" message={error} onRetry={handleRetry} />
        </section>
      )}

      {/* Result */}
      {result && !isLoading && !error && (
        <section className="max-w-[720px] mx-auto px-6 pb-16">
          <div className="vy-divider mb-10" />
          <ReadingCard result={result} />
        </section>
      )}
    </div>
  );
}
