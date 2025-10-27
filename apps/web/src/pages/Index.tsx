import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Calculator, Hash, BookOpen, Heart, Clock, Settings, Calendar, Camera, Image as ImageIcon, Send } from "lucide-react";
import { Link } from "react-router-dom";
import vybeLogo from "@/assets/vybe-logo.png";
import { Footer } from "@/components/Footer";
import { useToast } from "@/components/ui/use-toast";
import { checkCameraPermission, requestCameraPermission } from "@/lib/permissions";
import { PermissionPrompt } from "@/components/PermissionPrompt";
import { useTimeCapture } from "@/features/capture/hooks/useTimeCapture";
import { useTextInput } from "@/features/capture/hooks/useTextInput";
import { useImageProcessing } from "@/features/capture/hooks/useImageProcessing";

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
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [combinedReading, setCombinedReading] = useState<Reading | null>(null);
  const [combinedCapturedAt, setCombinedCapturedAt] = useState<string>("");

  // Time capture hook
  const timeCapture = useTimeCapture(
    (reading) => {
      setCombinedReading(reading);
      setCombinedCapturedAt(timeCapture.capturedAt);
      toast({
        title: "Vybe captured! 🌟",
        description: `Reading generated for ${reading.input_text}`,
      });
    },
    (error) => {
      toast({
        title: "Processing failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  );

  // Text input hook
  const textInput = useTextInput(
    (reading) => {
      setCombinedReading(reading);
      setCombinedCapturedAt(textInput.capturedAt);
      toast({
        title: "Reading generated! 🌟",
        description: "Your vybe reading is ready",
      });
    },
    (error) => {
      toast({
        title: "Processing failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
    () => {
      toast({
        title: "No input",
        description: "Please enter numbers or text",
        variant: "destructive",
      });
    }
  );

  // Image processing hook
  const imageProcessing = useImageProcessing(
    (readings) => {
      setCombinedReading(readings[0]);
      setCombinedCapturedAt(imageProcessing.capturedAt);
      toast({
        title: "Vybe captured! 🌟",
        description: `Found ${readings.length} frequency signal(s)`,
        duration: 4000,
      });
    },
    (error) => {
      toast({
        title: error.title,
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    },
    () => {
      setShowPermissionPrompt(true);
    }
  );

  // Determine combined processing state
  const isProcessing = timeCapture.isProcessing || textInput.isProcessing || imageProcessing.isProcessing;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check camera permission on mount
  useEffect(() => {
    const checkPermissions = async () => {
      const cameraResult = await checkCameraPermission();
      imageProcessing.setCameraPermissionStatus(cameraResult.status);
    };
    checkPermissions();
  }, []);

  const handleRequestCameraPermission = async () => {
    const result = await requestCameraPermission();
    imageProcessing.setCameraPermissionStatus(result.status);
    setShowPermissionPrompt(false);

    if (result.status === 'granted') {
      toast({
        title: "Permission granted",
        description: "You can now use camera features"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
      {/* Permission Prompt Modal */}
      {showPermissionPrompt && (
        <PermissionPrompt
          permissionType="camera"
          status={imageProcessing.cameraPermissionStatus}
          onRequest={handleRequestCameraPermission}
          onDismiss={() => setShowPermissionPrompt(false)}
          variant="modal"
        />
      )}

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
                  onClick={timeCapture.captureTime}
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

              {/* Text Input for Numbers/Chat */}
              <Card className="mb-4 w-full max-w-2xl border-lf-violet/30 bg-lf-ink/60 p-6 backdrop-blur">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Enter Numbers or Ask a Question</h3>
                    <p className="text-sm text-lf-slate">Type numbers (11:11, 222, etc.) or ask about your vybe</p>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Enter numbers or ask a question... (e.g., 11:11, 222, or 'What does 333 mean?')"
                      value={textInput.textInput}
                      onChange={(e) => textInput.setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          textInput.submitText();
                        }
                      }}
                      disabled={isProcessing}
                      className="min-h-24 border-lf-violet/30 bg-lf-midnight/50 text-white placeholder:text-lf-slate resize-none"
                    />
                  </div>
                  <Button
                    onClick={textInput.submitText}
                    disabled={isProcessing || !textInput.textInput.trim()}
                    className="w-full gap-2 bg-lf-gradient hover:shadow-glow"
                  >
                    <Send className="h-4 w-4" />
                    {isProcessing ? "Processing..." : "Get Reading"}
                  </Button>
                </div>
              </Card>

              {/* Quick Capture Buttons */}
              <div className="flex flex-col items-center gap-3 mb-4">
                {/* Processing Step Indicator */}
                {imageProcessing.processingStep && (
                  <div className="text-sm text-lf-aurora animate-pulse">
                    {imageProcessing.processingStep}
                  </div>
                )}

                {/* Cooldown Message */}
                {imageProcessing.isInCooldown && !isProcessing && (
                  <div className="text-sm text-lf-violet">
                    Please wait before trying again...
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={imageProcessing.handleCameraCapture}
                    disabled={isProcessing || imageProcessing.isInCooldown}
                    variant="outline"
                    className="gap-2 border-lf-aurora text-lf-aurora hover:bg-lf-aurora/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Camera className="h-4 w-4" />
                    {imageProcessing.isInCooldown ? "Wait..." : "Take Photo"}
                  </Button>
                  <Button
                    onClick={imageProcessing.handlePickPhoto}
                    disabled={isProcessing || imageProcessing.isInCooldown}
                    variant="outline"
                    className="gap-2 border-lf-violet text-lf-violet hover:bg-lf-violet/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {imageProcessing.isInCooldown ? "Wait..." : "Choose Image"}
                  </Button>
                </div>
              </div>

              <Link to="/get-vybe">
                <Button variant="ghost" className="gap-2 text-lf-slate hover:text-lf-aurora text-sm">
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
      {combinedReading && (
        <div className="container mx-auto px-6 pb-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 text-center flex items-center justify-center gap-4">
              <p className="text-sm text-lf-slate">Captured at {combinedCapturedAt}</p>
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
                  {combinedReading.numerology_data.guidance}
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
