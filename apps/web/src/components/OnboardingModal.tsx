import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Camera, Sparkles } from "lucide-react";

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('vyberology_onboarding');
    if (!hasSeenOnboarding) {
      // Small delay so it doesn't appear immediately
      setTimeout(() => setShow(true), 500);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('vyberology_onboarding', 'true');
    setShow(false);
  };

  const steps = [
    {
      icon: <Clock className="h-12 w-12 text-lf-aurora" />,
      title: "Capture the Moment",
      description: "Tap the clock to read your current time's energy. Each moment carries its own frequency.",
    },
    {
      icon: <Camera className="h-12 w-12 text-lf-violet" />,
      title: "Scan Numbers Anywhere",
      description: "See 11:11 on a receipt? 444 on a license plate? Snap a photo and decode the frequency signal.",
    },
    {
      icon: <Sparkles className="h-12 w-12 text-lf-aurora" />,
      title: "Get Personal Guidance",
      description: "Receive resonance readings that align with your life's frequency. Track patterns in your history.",
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="sm:max-w-md bg-lf-ink border-lf-violet/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-white text-center">
            Welcome to Vyberology ✨
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Step Indicator */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`h-2 w-8 rounded-full transition-colors ${
                  num === step ? 'bg-lf-aurora' : 'bg-lf-violet/30'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-lf-gradient p-6">
              {currentStep.icon}
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold text-white">
              {currentStep.title}
            </h3>
            <p className="text-lf-slate">
              {currentStep.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 border-lf-violet/30 text-lf-violet hover:bg-lf-violet/10"
              >
                Back
              </Button>
            )}
            <Button
              onClick={() => {
                if (step === 3) {
                  handleComplete();
                } else {
                  setStep(step + 1);
                }
              }}
              className="flex-1 bg-lf-gradient hover:shadow-glow"
            >
              {step === 3 ? "Get Started" : "Next"}
            </Button>
          </div>

          {/* Skip */}
          {step < 3 && (
            <button
              onClick={handleComplete}
              className="w-full text-sm text-lf-slate hover:text-lf-aurora transition-colors"
            >
              Skip intro
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
