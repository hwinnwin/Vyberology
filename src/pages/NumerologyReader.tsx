import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ReadingForm } from "@/components/ReadingForm";
import { ReadingCard } from "@/components/ReadingCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { ReadingResult } from "@/lib/numerology";

export default function NumerologyReader() {
  const [result, setResult] = useState<ReadingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (fullName: string, dob: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('read', {
        body: { fullName, dob }
      });

      if (error) throw error;

      setResult(data);
    } catch (error) {
      console.error('Error generating reading:', error);
      toast({
        title: "Error",
        description: "Failed to generate reading. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

        {result && <ReadingCard result={result} />}
      </div>
    </div>
  );
}
