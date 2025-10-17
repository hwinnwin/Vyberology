import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { ReadingForm } from "@/components/ReadingForm";
import { ReadingCard } from "@/components/ReadingCard";
import { Button } from "@/components/ui/button";
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
    setResult(null); // Clear previous result

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

      // Save to history
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
    // The form will still have the previous values, user can just resubmit
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
      <div className="container max-w-4xl py-12 space-y-8">
        <div className="flex items-center justify-between mb-8">
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

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Numerology Reader</h1>
          <p className="text-lf-slate">
            Discover your numbers and dominant chakras
          </p>
        </div>

        <ReadingForm onGenerate={handleGenerate} isLoading={isLoading} />

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner
              size="lg"
              text="Calculating your numerology... This may take a moment."
            />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorMessage
            title="Failed to Generate Reading"
            message={error}
            onRetry={handleRetry}
          />
        )}

        {/* Success State - Display Reading */}
        {result && !isLoading && !error && <ReadingCard result={result} />}
      </div>
    </div>
  );
}
