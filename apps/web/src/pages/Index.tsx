import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Calculator, Hash, BookOpen, Heart, Settings, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { useToast } from "@/components/ui/use-toast";
import { checkCameraPermission, requestCameraPermission } from "@/lib/permissions";
import { PermissionPrompt } from "@/components/PermissionPrompt";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useTimeCapture } from "@/features/capture/hooks/useTimeCapture";
import { useTextInput } from "@/features/capture/hooks/useTextInput";
import { useImageProcessing } from "@/features/capture/hooks/useImageProcessing";
import { CaptureTabs } from "@/features/capture/components/CaptureTabs";
import { getErrorMessage, getRecoveryAction } from "@/lib/errorMessages";
import { ToastAction } from "@/components/ui/toast";

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
      const errorMsg = getErrorMessage(error.message);
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: "destructive",
        duration: 5000,
        action: errorMsg.action ? (
          <ToastAction
            altText={getRecoveryAction(errorMsg.action)}
            onClick={() => {
              if (errorMsg.action === 'settings') {
                window.open('app-settings:', '_blank');
              }
            }}
          >
            {getRecoveryAction(errorMsg.action)}
          </ToastAction>
        ) : undefined,
      });
    },
    () => {
      setShowPermissionPrompt(true);
    }
  );

  // Determine combined processing state
  const isProcessing = timeCapture.isProcessing || textInput.isProcessing || imageProcessing.isProcessing;

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
      {/* Onboarding Modal */}
      <OnboardingModal />

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

            {/* Capture Tabs - Unified Interface */}
            <div className="mb-8 flex flex-col items-center w-full">
              <CaptureTabs
                onTimeCapture={timeCapture.captureTime}
                textValue={textInput.textInput}
                onTextChange={textInput.setTextInput}
                onTextSubmit={textInput.submitText}
                onCameraCapture={imageProcessing.handleCameraCapture}
                onPickPhoto={imageProcessing.handlePickPhoto}
                processingStep={imageProcessing.processingStep}
                isInCooldown={imageProcessing.isInCooldown}
                isProcessing={isProcessing}
              />
              
              <Link to="/get-vybe" className="mt-4">
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
