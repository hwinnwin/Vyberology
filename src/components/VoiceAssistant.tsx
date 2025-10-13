import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import vybeLogo from "@/assets/vybe-logo.png";

// TypeScript types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
  isActive?: boolean;
  disabled?: boolean;
}

export const VoiceAssistant = ({ onCommand, isActive = false, disabled = false }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Check if already has permission on mount (for mobile)
  useEffect(() => {
    const checkExistingPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionGranted(true);
      } catch (error) {
        setPermissionGranted(false);
      }
    };

    checkExistingPermission();
  }, []);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (import.meta.env.DEV) {
        console.warn("Speech recognition not supported in this browser");
      }
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = (finalTranscript + interimTranscript).toLowerCase();
      setTranscript(fullTranscript);

      // Check for wake word "hey lumen"
      if (fullTranscript.includes('hey lumen') || fullTranscript.includes('hi lumen')) {
        setWakeWordDetected(true);
        setIsProcessing(true);

        toast({
          title: "👋 Hey there!",
          description: "Lumen is listening... What's the vybe?",
        });

        // Extract command after wake word
        const commandStart = fullTranscript.indexOf('lumen') + 5;
        const command = fullTranscript.substring(commandStart).trim();

        if (command) {
          setTimeout(() => {
            onCommand(command);
            setWakeWordDetected(false);
            setIsProcessing(false);
            setTranscript("");
          }, 500);
        } else {
          // Wait for command
          setTimeout(() => {
            setIsProcessing(false);
          }, 3000);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (import.meta.env.DEV) {
        console.error('Speech recognition error:', event.error);
      }
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice commands",
          variant: "destructive",
        });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isActive && !disabled) {
        // Restart if still active
        try {
          recognition.start();
        } catch (e) {
          if (import.meta.env.DEV) {
            console.error("Failed to restart recognition:", e);
          }
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isActive, disabled, onCommand, toast]);

  const requestMicrophonePermission = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log("Requesting microphone permission...");
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Not supported",
          description: "Your browser doesn't support microphone access. Try Chrome or Safari.",
          variant: "destructive",
        });
        return false;
      }

      // Request microphone permission
      if (import.meta.env.DEV) {
        console.log("Calling getUserMedia...");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (import.meta.env.DEV) {
        console.log("Permission granted, stream obtained:", stream);
      }

      // Stop the stream immediately (we only needed permission)
      stream.getTracks().forEach(track => {
        if (import.meta.env.DEV) {
          console.log("Stopping track:", track);
        }
        track.stop();
      });

      setPermissionGranted(true);
      setShowPermissionPrompt(false);

      toast({
        title: "Permission granted! 🎤",
        description: "You can now use voice commands",
      });

      // Auto-start listening after permission granted
      setTimeout(() => {
        startListeningAfterPermission();
      }, 500);

      return true;
    } catch (error: unknown) {
      const err = error as Error & { name?: string };
      if (import.meta.env.DEV) {
        console.error("Permission error:", error);
        console.error("Error name:", err?.name);
        console.error("Error message:", err?.message);
      }

      setPermissionGranted(false);

      let errorMessage = "Click the icon in your address bar to enable microphone access";

      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        errorMessage = "Permission denied. Click the 🔒 icon in your address bar and allow microphone.";
      } else if (err?.name === "NotFoundError") {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      } else if (err?.name === "NotSupportedError") {
        errorMessage = "Microphone not supported in this browser. Try Chrome or Safari.";
      }

      toast({
        title: "Microphone access denied",
        description: errorMessage,
        variant: "destructive",
      });

      setShowPermissionPrompt(false);
      return false;
    }
  };

  const startListeningAfterPermission = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        toast({
          title: "Listening...",
          description: 'Say "Hey Lumen" to activate',
        });
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("Failed to start recognition:", e);
        }
        toast({
          title: "Voice recognition error",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }
  };

  const startListening = async () => {
    // Check if we already have permission
    if (!permissionGranted) {
      // Show permission prompt
      setShowPermissionPrompt(true);
      return;
    }

    startListeningAfterPermission();
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setTranscript("");
      setWakeWordDetected(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Card className={`border-lf-violet/30 bg-lf-ink/60 p-6 backdrop-blur transition-all ${
      wakeWordDetected ? 'border-lf-aurora shadow-glow' : ''
    }`}>
      <div className="flex flex-col items-center gap-4">
        {/* Lumen Avatar with Animation */}
        <div className="relative">
          <div className={`relative grid place-items-center rounded-full bg-gradient-to-br from-lf-violet to-lf-aurora p-4 ${
            isListening ? 'animate-pulse' : ''
          }`} style={{ animationDuration: wakeWordDetected ? '0.5s' : '2s' }}>
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-lf-violet/20 animate-ping" style={{ animationDuration: '1.5s' }}></span>
                <span className="absolute inset-0 rounded-full bg-lf-aurora/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></span>
              </>
            )}
            <img src={vybeLogo} alt="Lumen" className="h-16 w-16 relative z-10" />
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <h3 className="font-display text-xl font-semibold text-white mb-2">
            {wakeWordDetected ? "I'm listening!" : isListening ? "Say 'Hey Lumen'" : "Voice Assistant"}
          </h3>
          {isListening && transcript && (
            <p className="text-sm text-lf-slate italic">"{transcript}"</p>
          )}
          {!isListening && (
            <p className="text-sm text-lf-slate">
              Activate voice commands with "Hey Lumen"
            </p>
          )}
        </div>

        {/* Toggle Button */}
        <Button
          onClick={toggleListening}
          disabled={disabled}
          className={`gap-2 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-lf-gradient hover:shadow-glow'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-5 w-5" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              Start Listening
            </>
          )}
        </Button>

        {/* Voice Commands Help */}
        <div className="w-full mt-4 p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-lf-aurora" />
            <h4 className="text-sm font-semibold text-white">Voice Commands</h4>
          </div>
          <ul className="text-xs text-lf-slate space-y-1">
            <li>"Hey Lumen, what's the vybe?" - Capture current time</li>
            <li>"Hey Lumen, read [number]" - Get reading for specific number</li>
            <li>"Hey Lumen, show history" - View reading history</li>
          </ul>
        </div>
      </div>

      {/* Permission Prompt Modal */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-lf-ink/95 border border-lf-aurora/50 rounded-xl p-8 max-w-md shadow-glow-lg">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="rounded-full bg-lf-gradient p-6">
                  <Mic className="h-12 w-12 text-white" />
                </div>
                <span className="absolute inset-0 rounded-full bg-lf-aurora/20 animate-ping"></span>
              </div>

              <div>
                <h3 className="font-display text-2xl font-bold text-white mb-2">
                  Enable Voice Commands?
                </h3>
                <p className="text-lf-slate text-sm">
                  Vyberology needs access to your microphone to use the "Hey Lumen" voice assistant.
                </p>
              </div>

              <div className="w-full space-y-3 text-xs text-lf-slate text-left">
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Voice commands processed locally on your device</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Audio is never uploaded or recorded</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>You can disable this anytime</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <Button
                  onClick={requestMicrophonePermission}
                  className="flex-1 bg-lf-gradient hover:shadow-glow"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Allow Microphone
                </Button>
                <Button
                  onClick={() => setShowPermissionPrompt(false)}
                  variant="outline"
                  className="flex-1 border-lf-violet text-lf-violet hover:bg-lf-violet/10"
                >
                  Not Now
                </Button>
              </div>

              <p className="text-xs text-lf-slate">
                <strong>Desktop:</strong> Browser will show a popup. Click "Allow".<br/>
                <strong>Mobile:</strong> Look for permission request at the <strong>bottom</strong> of your screen. Tap "Allow".
              </p>

              <div className="w-full pt-4 border-t border-lf-violet/20">
                <details className="text-xs text-lf-slate">
                  <summary className="cursor-pointer hover:text-white">
                    ⚠️ Not seeing the permission prompt?
                  </summary>
                  <div className="mt-2 space-y-2">
                    <p><strong>Chrome:</strong></p>
                    <ol className="ml-4 space-y-1">
                      <li>1. Look for 🔒 icon in address bar (left side)</li>
                      <li>2. Click it → Site settings</li>
                      <li>3. Find "Microphone" → Change to "Allow"</li>
                      <li>4. Refresh this page</li>
                    </ol>
                    <p className="mt-2"><strong>Safari:</strong></p>
                    <ol className="ml-4 space-y-1">
                      <li>1. Safari menu → Settings for This Website</li>
                      <li>2. Find "Microphone" → Change to "Allow"</li>
                      <li>3. Refresh this page</li>
                    </ol>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
