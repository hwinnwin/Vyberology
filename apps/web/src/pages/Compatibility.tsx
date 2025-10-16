import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompatibilityForm } from "@/components/CompatibilityForm";
import { PairReadingCard } from "@/components/PairReadingCard";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { saveReading } from "@/lib/readingHistory";
import type { PairReading } from "@/lib/numerology/compat";

export default function Compatibility() {
  const navigate = useNavigate();
  const [result, setResult] = useState<PairReading | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (aName: string, aDob: string, bName: string, bDob: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null); // Clear previous result

    try {
      const { data, error } = await supabase.functions.invoke('compare', {
        body: { aName, aDob, bName, bDob }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate compatibility reading');
      }

      if (!data) {
        throw new Error('No data received from server');
      }

      setResult(data);

      // Save to history
      saveReading({
        inputType: 'manual',
        inputValue: `${aName} & ${bName}`,
        reading: JSON.stringify(data),
      });

      toast({
        title: "Success!",
        description: "Your compatibility reading has been generated.",
      });
    } catch (error) {
      console.error('Error generating compatibility reading:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

      setError(errorMessage);

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
          <h1 className="text-4xl font-bold tracking-tight text-white">Compatibility Reading</h1>
          <p className="text-lf-slate">
            Discover how two numerology profiles interact and complement each other
          </p>
        </div>

        <CompatibilityForm onGenerate={handleGenerate} isLoading={isLoading} />

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner
              size="lg"
              text="Calculating compatibility... This may take a moment."
            />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorMessage
            title="Failed to Generate Compatibility Reading"
            message={error}
            onRetry={handleRetry}
          />
        )}

        {/* Success State - Display Reading */}
        {result && !isLoading && !error && <PairReadingCard reading={result} />}
      </div>
    </div>
  );
}
