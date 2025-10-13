import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Calculator, Hash, BookOpen, Heart, Clock, Settings, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import vybeLogo from "@/assets/vybe-logo.png";
import { Footer } from "@/components/Footer";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { saveReading } from "@/lib/readingHistory";

interface Reading {
  input_text: string;
  normalized_number: string;
  numerology_data: {
    headline: string;
    keywords: string[];
    guidance: string;
  };
  chakra_data: {
    name: string;
    element: string;
    focus: string;
    color: string;
    amplified?: boolean;
    message?: string;
  };
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [capturedAt, setCapturedAt] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCaptureTime = async () => {
    setIsProcessing(true);
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    setCapturedAt(now.toLocaleString());

    try {
      const { data, error } = await supabase.functions.invoke("vybe-reading", {
        body: {
          inputs: [
            { label: 'Time', value: timeString }
          ],
          depth: 'standard'
        },
      });

      if (error) throw error;

      if (data?.reading) {
        // Store as markdown content
        const newReading = {
          input_text: timeString,
          normalized_number: '',
          numerology_data: {
            headline: 'Vyberology Reading',
            keywords: [],
            guidance: data.reading
          },
          chakra_data: {
            name: '',
            element: '',
            focus: '',
            color: '#6B46C1'
          }
        };

        setReading(newReading);

        // Save to history
        saveReading({
          inputType: 'time',
          inputValue: timeString,
          reading: data.reading,
        });

        toast({
          title: "Vybe captured! 🌟",
          description: `Reading generated for ${timeString}`,
        });
      }
    } catch (error) {
      console.error("Error processing time:", error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-lf-gradient opacity-10"></div>
        <div className="container relative mx-auto px-6 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-lf-aurora" />
              <span className="font-display text-xl font-bold text-lf-aurora">Vyberology</span>
            </div>
            <h1 className="mb-6 font-display text-6xl font-bold leading-tight text-white lg:text-7xl">
              Decode Your Life's Frequency
            </h1>
            <p className="mb-8 text-xl text-lf-slate">
              Turn numbers into resonance. Modern numerology and frequency readings that transform names, birthdates, and repeating numbers into personal guidance.
            </p>

            {/* Main Vybe Button */}
            <div className="mb-8 flex flex-col items-center">
              <Card className="mb-6 border-lf-aurora/30 bg-lf-gradient p-8 text-center shadow-glow inline-block">
                <div className="mb-4 flex items-center justify-center gap-3">
                  <Clock className="h-8 w-8 text-white" />
                  <span className="font-display text-6xl font-bold text-white">
                    {currentTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </span>
                </div>
                <p className="mb-6 text-white/80">
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <Button
                  onClick={handleCaptureTime}
                  disabled={isProcessing}
                  className="relative inline-flex h-auto min-w-[220px] flex-col items-center gap-3 rounded-full bg-white px-6 py-5 font-semibold text-lf-indigo shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-lf-aurora disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto animate-pulse"
                  style={{ animationDuration: '3s' }}
                >
                  {isProcessing ? (
                    <span className="text-lg">Capturing...</span>
                  ) : (
                    <>
                      <span className="text-lg">What's the</span>
                      <span className="relative grid place-items-center rounded-full bg-white p-3 shadow-lg ring-2 ring-lf-violet/30">
                        {/* Oscillating rings */}
                        <span className="absolute inset-0 rounded-full bg-lf-violet/20 animate-ping" style={{ animationDuration: '2s' }}></span>
                        <span className="absolute inset-0 rounded-full bg-lf-aurora/20 animate-pulse" style={{ animationDuration: '3s' }}></span>
                        <img src={vybeLogo} alt="Vybe" className="h-12 w-12 relative z-10" />
                      </span>
                    </>
                  )}
                </Button>
              </Card>
              <Link to="/get-vybe">
                <Button variant="ghost" className="gap-2 text-lf-violet hover:text-lf-aurora">
                  <Settings className="h-4 w-4" />
                  Advanced Options
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/numerology">
                <Button className="gap-2 bg-lf-gradient px-8 py-6 text-lg font-semibold shadow-glow hover:shadow-glow-lg">
                  <Calculator className="h-5 w-5" />
                  My Numerology
                </Button>
              </Link>
              <Link to="/compatibility">
                <Button variant="outline" className="gap-2 border-lf-violet px-8 py-6 text-lg text-lf-violet hover:bg-lf-violet/10">
                  <Heart className="h-5 w-5" />
                  Compatibility
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reading Result */}
      {reading && (
        <div className="container mx-auto px-6 pb-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 text-center flex items-center justify-center gap-4">
              <p className="text-sm text-lf-slate">Captured at {capturedAt}</p>
              <Link to="/history">
                <Button variant="ghost" size="sm" className="gap-2 text-lf-violet hover:text-lf-aurora">
                  <Calendar className="h-4 w-4" />
                  View History
                </Button>
              </Link>
            </div>
            <Card className="border-lf-violet/30 bg-lf-ink/60 p-8 backdrop-blur transition-all hover:border-lf-violet hover:shadow-glow">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {reading.numerology_data.guidance}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-white/10 bg-lf-ink/60 p-8 backdrop-blur transition-all hover:border-lf-violet hover:shadow-glow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lf-gradient">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 font-display text-2xl font-bold text-white">Numerology Module</h3>
            <p className="text-lf-slate">
              Input your full name and birthdate to reveal your 5 core numbers: Life Path, Expression, Soul Urge, Personality, and Birthday.
            </p>
          </Card>

          <Card className="border-white/10 bg-lf-ink/60 p-8 backdrop-blur transition-all hover:border-lf-violet hover:shadow-glow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lf-gradient">
              <Hash className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 font-display text-2xl font-bold text-white">Frequency Readings</h3>
            <p className="text-lf-slate">
              See 1111, 0440, or other repeating numbers? Decode them as frequency codes and capture what was happening in your life.
            </p>
          </Card>

          <Card className="border-white/10 bg-lf-ink/60 p-8 backdrop-blur transition-all hover:border-lf-violet hover:shadow-glow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lf-gradient">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 font-display text-2xl font-bold text-white">Frequency Log</h3>
            <p className="text-lf-slate">
              Your personal journal timeline showing captured numbers, meanings, and reflections. Track your journey of alignment.
            </p>
          </Card>
        </div>
      </div>

      {/* Brand Kit Link */}
      <div className="container mx-auto px-6 pb-16">
        <Card className="border-lf-violet bg-lf-gradient p-12 text-center shadow-glow-lg">
          <Sparkles className="mx-auto mb-4 h-12 w-12 text-white" />
          <h2 className="mb-4 font-display text-3xl font-bold text-white">
            Explore the Brand
          </h2>
          <p className="mb-6 text-white/90">
            View our complete brand identity, color system, typography, and design guidelines.
          </p>
          <Link to="/brand">
            <Button className="bg-white font-semibold text-lf-indigo hover:bg-white/90">
              View Brand Kit
            </Button>
          </Link>
        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
