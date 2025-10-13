import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompatibilityForm } from "@/components/CompatibilityForm";
import { PairReadingCard } from "@/components/PairReadingCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { PairReading } from "@/lib/numerology/compat";

export default function Compatibility() {
  const navigate = useNavigate();
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

        {result && <PairReadingCard reading={result} />}
      </div>
    </div>
  );
}
