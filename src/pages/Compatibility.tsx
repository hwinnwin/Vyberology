import { useState } from "react";
import { CompatibilityForm } from "@/components/CompatibilityForm";
import { PairReadingCard } from "@/components/PairReadingCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { PairReading } from "@/lib/numerology/compat";

export default function Compatibility() {
  const [result, setResult] = useState<PairReading | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (aName: string, aDob: string, bName: string, bDob: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('compare', {
        body: { aName, aDob, bName, bDob }
      });

      if (error) throw error;

      setResult(data);
    } catch (error) {
      console.error('Error generating compatibility reading:', error);
      toast({
        title: "Error",
        description: "Failed to generate compatibility reading. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Compatibility Reading</h1>
          <p className="text-muted-foreground">
            Discover how two numerology profiles interact and complement each other
          </p>
        </div>

        <CompatibilityForm onGenerate={handleGenerate} isLoading={isLoading} />

        {result && <PairReadingCard reading={result} />}
      </div>
    </div>
  );
}
