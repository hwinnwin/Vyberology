/**
 * Five-Number Oracle Page
 *
 * Interactive interface for capturing 5 numbers and generating oracle readings.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Hash, Sparkles, ArrowRight, RotateCcw, Share2, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface NumberCapture {
  number: number | null;
  timestamp: Date | null;
  method: 'time' | 'manual' | 'pattern';
}

interface OracleReading {
  numbers: number[];
  coreFrequencies: number[];
  meanings: Array<{
    number: number;
    meaning: string;
    action: string;
    element: string;
    chakra: string;
    keywords: string[];
  }>;
  pattern: {
    type: string;
    description: string;
    strength: number;
    dominantElement: string;
    dominantChakra: string;
    synthesis: string;
    actionSequence: string[];
  };
  title: string;
  synthesis: string;
  essenceSentence: string;
  cta: string;
  markdown: string;
}

const ELEMENT_EMOJI = {
  Fire: '🜂',
  Air: '🜁',
  Earth: '🜃',
  Water: '🜄'
};

const CHAKRA_EMOJI = {
  'Root': '❤️',
  'Sacral': '🧡',
  'Solar Plexus': '💛',
  'Heart': '💚',
  'Throat': '💙',
  'Third Eye': '💜',
  'Crown': '🤍'
};

const PATTERN_EMOJI = {
  build: '🏗️',
  release: '🌊',
  amplify: '📣',
  balanced: '⚖️',
  focused: '🎯',
  transition: '🦋',
  ascending: '🚀',
  descending: '🏔️',
  cyclical: '🔄'
};

export default function Oracle() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [captures, setCaptures] = useState<NumberCapture[]>(
    Array(5).fill({ number: null, timestamp: null, method: 'manual' })
  );
  const [currentSlot, setCurrentSlot] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reading, setReading] = useState<OracleReading | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const capturedCount = captures.filter(c => c.number !== null).length;
  const progress = (capturedCount / 5) * 100;

  const handleCaptureTime = () => {
    const timeString = currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Extract numbers from time (e.g., "11:11" -> 1111)
    const timeNumber = parseInt(timeString.replace(':', ''), 10);

    // Use modulo to get 1-99 range
    const number = (timeNumber % 99) + 1;

    captureNumber(number, 'time');
  };

  const handleManualCapture = () => {
    const num = parseInt(inputValue, 10);

    if (isNaN(num) || num < 1 || num > 99) {
      toast({
        title: "Invalid Number",
        description: "Please enter a number between 1 and 99",
        variant: "destructive"
      });
      return;
    }

    captureNumber(num, 'manual');
    setInputValue('');
  };

  const captureNumber = (number: number, method: 'time' | 'manual' | 'pattern') => {
    const newCaptures = [...captures];
    newCaptures[currentSlot] = {
      number,
      timestamp: new Date(),
      method
    };

    setCaptures(newCaptures);

    // Move to next empty slot
    const nextSlot = newCaptures.findIndex((c, i) => i > currentSlot && c.number === null);
    if (nextSlot !== -1) {
      setCurrentSlot(nextSlot);
    } else {
      setCurrentSlot(capturedCount < 4 ? currentSlot + 1 : 4);
    }
  };

  const handleSlotClick = (index: number) => {
    setCurrentSlot(index);
  };

  const handleReset = () => {
    setCaptures(Array(5).fill({ number: null, timestamp: null, method: 'manual' }));
    setCurrentSlot(0);
    setReading(null);
    setInputValue('');
  };

  const handleGenerate = async () => {
    const numbers = captures.map(c => c.number).filter((n): n is number => n !== null);

    if (numbers.length !== 5) {
      toast({
        title: "Not Ready",
        description: "Capture all 5 numbers first",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oracle-reading`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            numbers,
            captureTimestamps: captures.map(c => c.timestamp?.toISOString()),
            captureMethods: captures.map(c => c.method),
            sessionType: 'instant',
            tier: 'free',
            saveToHistory: !!session?.user
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate oracle reading');
      }

      const result = await response.json();

      if (result.success && result.reading) {
        setReading(result.reading);
        toast({
          title: "✨ Oracle Reading Complete",
          description: `${result.reading.pattern.type} pattern detected`
        });
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Oracle error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!reading) return;

    const text = `🔮 Five-Number Oracle\n\nNumbers: ${reading.numbers.join(' · ')}\nPattern: ${reading.pattern.type}\n\n${reading.essenceSentence}\n\nGet your oracle reading at vyberology.com/oracle`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Reading copied to clipboard"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <AppHeader />

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            🔮 Five-Number Oracle
          </h1>
          <p className="text-muted-foreground text-lg">
            Draw 5 numbers. Discover your pattern. Receive guidance.
          </p>
          <Progress value={progress} className="max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground">
            {capturedCount} of 5 numbers captured
          </p>
        </div>

        {!reading ? (
          <>
            {/* Number Slots */}
            <Card>
              <CardHeader>
                <CardTitle>Your Five Numbers</CardTitle>
                <CardDescription>
                  Capture numbers from time, manual entry, or patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  {captures.map((capture, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlotClick(index)}
                      className={cn(
                        "aspect-square rounded-lg border-2 transition-all",
                        "flex flex-col items-center justify-center gap-2",
                        currentSlot === index && "border-primary ring-2 ring-primary/20",
                        capture.number !== null && "bg-primary/10 border-primary",
                        capture.number === null && "border-dashed border-muted-foreground/30"
                      )}
                    >
                      {capture.number !== null ? (
                        <>
                          <span className="text-3xl font-bold">{capture.number}</span>
                          <Badge variant="outline" className="text-xs">
                            {capture.method === 'time' ? '🕐' : capture.method === 'manual' ? '✍️' : '📋'}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-4xl text-muted-foreground/30">{index + 1}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Capture Methods */}
                <div className="space-y-4">
                  {/* Time Capture */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-2xl font-mono font-bold text-center p-4 rounded-lg bg-muted">
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                    </div>
                    <Button
                      onClick={handleCaptureTime}
                      disabled={capturedCount >= 5}
                      variant="outline"
                      size="lg"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Capture Time
                    </Button>
                  </div>

                  {/* Manual Entry */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        placeholder="Enter number 1-99"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleManualCapture();
                        }}
                        disabled={capturedCount >= 5}
                      />
                    </div>
                    <Button
                      onClick={handleManualCapture}
                      disabled={capturedCount >= 5 || !inputValue}
                      variant="outline"
                      size="lg"
                    >
                      <Hash className="mr-2 h-4 w-4" />
                      Add Number
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                    disabled={capturedCount === 0}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={capturedCount < 5 || isGenerating}
                    className="flex-1"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Consult Oracle
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Oracle Reading Display */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {PATTERN_EMOJI[reading.pattern.type as keyof typeof PATTERN_EMOJI] || '🔮'}
                      {reading.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {reading.pattern.description} • {(reading.pattern.strength * 100).toFixed(0)}% coherence
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Numbers Display */}
                <div className="grid grid-cols-5 gap-2">
                  {reading.meanings.map((meaning, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-muted text-center"
                    >
                      <div className="text-2xl font-bold mb-1">{meaning.number}</div>
                      <div className="text-xs text-muted-foreground">
                        {ELEMENT_EMOJI[meaning.element as keyof typeof ELEMENT_EMOJI]} {meaning.element}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Individual Meanings */}
                <div className="space-y-4">
                  {reading.meanings.map((meaning, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-primary">{meaning.number}</span>
                        <span className="text-sm font-medium">{meaning.meaning}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        _{meaning.action}_ • {ELEMENT_EMOJI[meaning.element as keyof typeof ELEMENT_EMOJI]} {meaning.element} • {CHAKRA_EMOJI[meaning.chakra as keyof typeof CHAKRA_EMOJI]} {meaning.chakra}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Synthesis */}
                <div className="rounded-lg bg-primary/10 p-6 border-2 border-primary/20">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    ✨ Synthesis
                  </h3>
                  <p className="text-foreground/90">{reading.synthesis}</p>
                </div>

                {/* Action Sequence */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    🎯 Action Sequence
                  </h3>
                  <ol className="space-y-2">
                    {reading.pattern.actionSequence.map((action, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="pt-0.5">{action}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Essence Sentence */}
                <div className="rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 p-6 text-center border-2 border-primary/20">
                  <p className="text-lg font-medium italic">
                    {reading.essenceSentence}
                  </p>
                </div>

                {/* CTA */}
                <div className="text-center">
                  <p className="font-semibold text-primary">{reading.cta}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
