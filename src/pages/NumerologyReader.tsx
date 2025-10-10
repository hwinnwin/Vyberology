import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ReadingForm } from "@/components/ReadingForm";
import { ReadingCard } from "@/components/ReadingCard";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { ReadingResult } from "@/lib/numerology";

export default function NumerologyReader() {
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
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Numerology Reader</h1>
          <p className="text-muted-foreground">
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
