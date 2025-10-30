import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, Clock, Image as ImageIcon, Send, Hash, Camera as CameraIcon, ArrowLeft, Home } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionPrompt } from "@/components/PermissionPrompt";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { useNavigate } from "react-router-dom";
import {
  checkCameraPermission,
  requestCameraPermission,
  checkMicrophonePermission,
  requestMicrophonePermission,
  capturePhoto,
  pickPhoto,
  PermissionStatus
} from "@/lib/permissions";
import { saveReading } from "@/lib/readingHistory";
import { captureError, addBreadcrumb } from "@/lib/sentry";
import vybeLogo from "@/assets/vybe-logo.png";

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

const GetVybe = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [capturedAt, setCapturedAt] = useState<string>("");
  const [captureMode, setCaptureMode] = useState<"time" | "image">("time");
  const [manualNumbers, setManualNumbers] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<PermissionStatus>('prompt');
  const [micPermissionStatus, setMicPermissionStatus] = useState<PermissionStatus>('prompt');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState<'camera' | 'microphone' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      const cameraResult = await checkCameraPermission();
      setCameraPermissionStatus(cameraResult.status);

      const micResult = await checkMicrophonePermission();
      setMicPermissionStatus(micResult.status);
    };

    checkPermissions();
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
      addBreadcrumb('Time capture started', { time: timeString });

      const { data, error } = await supabase.functions.invoke("vybe-reading", {
        body: {
          inputs: [
            { label: 'Time', value: timeString }
          ],
          depth: 'standard'
        },
      });

      if (error) {
        captureError(error, {
          context: 'Time Capture - Vybe Reading',
          level: 'error',
          tags: { service: 'vybe-reading', function: 'time-capture' },
          extra: { time: timeString },
        });
        throw error;
      }

      if (data?.reading) {
        // Store as markdown content
        setReadings([{
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
        }]);

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
      captureError(error as Error, {
        context: 'Time Capture - Unexpected Error',
        level: 'error',
        tags: { service: 'time-capture' },
      });
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = async () => {
    // Check camera permission
    if (cameraPermissionStatus === 'denied') {
      setShowPermissionPrompt('camera');
      return;
    }

    try {
      const result = await capturePhoto();

      if (!result.success) {
        if (result.error && !result.error.includes('cancel')) {
          toast({
            title: "Camera Error",
            description: result.error,
            variant: "destructive"
          });

          if (result.error.includes('denied')) {
            setCameraPermissionStatus('denied');
            setShowPermissionPrompt('camera');
          }
        }
        return;
      }

      if (result.data) {
        // Convert data URL to File
        const response = await fetch(result.data);
        const blob = await response.blob();
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

        setSelectedImage(file);
        setPreviewUrl(result.data);
        setReadings([]);
        setCaptureMode("image");
        setCameraPermissionStatus('granted');

        toast({
          title: "Photo captured!",
          description: "Ready to read frequency numbers"
        });
      }
    } catch (error) {
      console.error("Camera capture error:", error);
      toast({
        title: "Camera failed",
        description: "Unable to capture photo",
        variant: "destructive"
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setReadings([]);
      setCaptureMode("image");
    }
  };

  const handlePickPhoto = async () => {
    try {
      const result = await pickPhoto();

      if (!result.success) {
        if (result.error && !result.error.includes('cancel')) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive"
          });
        }
        return;
      }

      if (result.data) {
        // Convert data URL to File
        const response = await fetch(result.data);
        const blob = await response.blob();
        const file = new File([blob], "selected-image.jpg", { type: "image/jpeg" });

        setSelectedImage(file);
        setPreviewUrl(result.data);
        setReadings([]);
        setCaptureMode("image");

        toast({
          title: "Image selected!",
          description: "Ready to read frequency numbers"
        });
      }
    } catch (error) {
      console.error("Photo picker error:", error);
      toast({
        title: "Selection failed",
        description: "Unable to pick image",
        variant: "destructive"
      });
    }
  };

  const handleCapture = async () => {
    if (!selectedImage) {
      toast({
        title: "No image",
        description: "Please select an image first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setCapturedAt(new Date().toLocaleString());

    try {
      addBreadcrumb('OCR processing started', {
        hasImage: !!selectedImage,
        imageSize: selectedImage.size,
      });

      // Convert image to base64 data URL for OCR function
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      console.log('Sending OCR request with base64 image, length:', base64Image.length);

      // Call OCR with JSON payload containing base64 imageUrl
      const { data, error } = await supabase.functions.invoke("ocr", {
        body: {
          imageUrl: base64Image,
          mode: "fast"
        },
      });

      if (error) {
        console.error("========== OCR Process Failed ==========");
        console.error("OCR error:", error);
        console.error("OCR error message:", error.message);
        console.error("OCR response data:", data);
        console.error("Full error object:", JSON.stringify(error, null, 2));
        console.error("Full data object:", JSON.stringify(data, null, 2));
        console.error("=======================================");

        // Capture error in Sentry with full details
        captureError(error, {
          context: 'OCR Processing - Edge Function',
          level: 'error',
          tags: {
            service: 'supabase-edge-function',
            function: 'ocr',
          },
          extra: {
            hasImage: !!selectedImage,
            imageSize: selectedImage.size,
            imageType: selectedImage.type,
            errorMessage: error.message,
            errorName: error.name,
            responseData: data,
            dataType: typeof data,
            dataKeys: data ? Object.keys(data) : [],
          },
        });

        // Show detailed error from function
        let errorMsg = "OCR processing failed";
        if (data && data.message) {
          errorMsg = data.message;
        } else if (data && data.details) {
          errorMsg = data.details.substring(0, 200);
        } else if (data && data.error) {
          errorMsg = data.error;
        }

        throw new Error(errorMsg);
      }

      console.log("OCR response data:", data);

      if (data.readings && data.readings.length > 0) {
        setReadings(data.readings);

        // Save each reading to history
        data.readings.forEach((reading: Reading) => {
          saveReading({
            inputType: 'image',
            inputValue: reading.input_text,
            reading: reading.numerology_data.guidance,
          });
        });

        toast({
          title: "Vybe captured! 🌟",
          description: `Found ${data.readings.length} frequency signal(s)`,
        });
      } else {
        toast({
          title: "No numbers detected",
          description: "Try an image with visible numbers, times, or patterns",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing image:", error);

      // Capture unexpected errors in Sentry
      captureError(error as Error, {
        context: 'OCR Processing - Unexpected Error',
        level: 'error',
        tags: {
          service: 'ocr-processing',
        },
        extra: {
          hasImage: !!selectedImage,
          imageSize: selectedImage?.size,
          imageType: selectedImage?.type,
        },
      });

      let errorMessage = "Please try again";
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "Image processing is taking too long. The OCR service may not be deployed.";
        } else if (error.message.includes('not found')) {
          errorMessage = "OCR service not found. It may not be deployed to Supabase.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestCameraPermission = async () => {
    const result = await requestCameraPermission();
    setCameraPermissionStatus(result.status);
    setShowPermissionPrompt(null);

    if (result.status === 'granted') {
      toast({
        title: "Permission granted",
        description: "You can now use camera features"
      });
    }
  };

  const handleRequestMicPermission = async () => {
    const result = await requestMicrophonePermission();
    setMicPermissionStatus(result.status);
    setShowPermissionPrompt(null);

    if (result.status === 'granted') {
      toast({
        title: "Permission granted",
        description: "You can now use voice features"
      });
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("vybe-reading", {
        body: {
          inputs: [{ label: 'Question', value: userMessage }],
          depth: 'standard'
        },
      });

      if (error) throw error;

      if (data?.reading) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reading }]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Chat failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();

    // "what's the vybe" - capture current time
    if (lowerCommand.includes("what") && lowerCommand.includes("vybe")) {
      await handleCaptureTime();
      return;
    }

    // "show history" - navigate to history
    if (lowerCommand.includes("history")) {
      navigate("/history");
      return;
    }

    // "read [number]" - generate reading for specific number
    const readMatch = lowerCommand.match(/read\s+(\d+)/);
    if (readMatch) {
      const number = readMatch[1];
      setManualNumbers(number);
      setIsProcessing(true);
      setCapturedAt(new Date().toLocaleString());

      try {
        const { data, error } = await supabase.functions.invoke("vybe-reading", {
          body: {
            inputs: [{ label: 'Numbers', value: number }],
            depth: 'standard'
          },
        });
        if (error) throw error;
        if (data?.reading) {
          setReadings([{
            input_text: number,
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
          }]);

          saveReading({
            inputType: 'manual',
            inputValue: number,
            reading: data.reading,
          });

          toast({
            title: "Reading generated! 🌟",
            description: `Your reading for ${number} is ready`,
          });
        }
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Processing failed",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Default: treat as chat message
    setChatInput(command);
    await handleSendChat();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
      <AppHeader />

      {/* Permission Prompts */}
      {showPermissionPrompt === 'camera' && (
        <PermissionPrompt
          permissionType="camera"
          status={cameraPermissionStatus}
          onRequest={handleRequestCameraPermission}
          onDismiss={() => setShowPermissionPrompt(null)}
          variant="modal"
        />
      )}

      {showPermissionPrompt === 'microphone' && (
        <PermissionPrompt
          permissionType="microphone"
          status={micPermissionStatus}
          onRequest={handleRequestMicPermission}
          onDismiss={() => setShowPermissionPrompt(null)}
          variant="modal"
        />
      )}

      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-lf-violet/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-40 right-20 w-40 h-40 bg-lf-aurora/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
            <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-lf-indigo/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
          </div>

          {/* Header */}
          <div className="mb-8 relative z-10">
            <div className="mb-6 flex items-center justify-between">
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
            <div className="mb-4 flex items-center justify-center gap-3">
              <img src={vybeLogo} alt="Vybe Logo" className="h-12" />
              <h1 className="font-display text-5xl font-bold text-white">Advanced Options</h1>
            </div>
            <p className="text-lg text-lf-slate text-center">
              Upload images, enter numbers manually, chat with Lumen, or explore frequency patterns
            </p>
          </div>

          {/* Current Time Display */}
          <Card className="mb-8 border-lf-aurora/30 bg-lf-gradient p-8 text-center shadow-glow">
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

          {/* Tabs for different input methods */}
          <Tabs defaultValue="image" className="mb-8">
            <TabsList className="grid w-full grid-cols-4 bg-lf-ink/60">
              <TabsTrigger value="image">Upload Image</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="image">
              <Card className="border-white/10 bg-lf-ink/60 p-8 backdrop-blur">
                <div className="space-y-6">
                  <div className="mb-4 text-center">
                    <h3 className="font-display text-xl font-semibold text-white">
                      Capture or Upload Image
                    </h3>
                    <p className="text-sm text-lf-slate">
                      Take a photo or upload screenshots with times, repeating numbers, or frequency patterns
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-4">
                    {!previewUrl ? (
                      <>
                        <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-lf-violet/50 bg-lf-midnight/50">
                          <div className="text-center">
                            <ImageIcon className="mx-auto mb-3 h-12 w-12 text-lf-violet" />
                            <p className="mb-1 text-sm font-semibold text-white">
                              Take a photo or choose an image
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={handleCameraCapture}
                            className="gap-2 bg-lf-gradient hover:shadow-glow"
                          >
                            <CameraIcon className="h-5 w-5" />
                            Take Photo
                          </Button>
                          <Button
                            onClick={handlePickPhoto}
                            variant="outline"
                            className="gap-2 border-lf-violet text-lf-violet hover:bg-lf-violet/10"
                          >
                            <ImageIcon className="h-5 w-5" />
                            Choose Image
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative w-full">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full rounded-lg border border-lf-violet/30"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={handlePickPhoto}
                            variant="outline"
                            className="gap-2 border-lf-violet text-lf-violet"
                          >
                            <Upload className="h-4 w-4" />
                            Change Image
                          </Button>
                          <Button
                            onClick={handleCapture}
                            disabled={isProcessing}
                            className="gap-2 bg-lf-gradient hover:shadow-glow"
                          >
                            <Sparkles className="h-4 w-4" />
                            {isProcessing ? "Reading Frequencies..." : "Read Image"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="manual">
              <Card className="border-white/10 bg-lf-ink/60 p-8 backdrop-blur">
                <div className="space-y-6">
                  <div className="mb-4 text-center">
                    <h3 className="font-display text-xl font-semibold text-white">
                      Enter Numbers Manually
                    </h3>
                    <p className="text-sm text-lf-slate">
                      Enter any numbers, times, or patterns you want to explore
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Enter numbers (e.g., 11:11, 222, 5/5/2025)..."
                      value={manualNumbers}
                      onChange={(e) => setManualNumbers(e.target.value)}
                      className="min-h-32 border-lf-violet/30 bg-lf-midnight/50 text-white placeholder:text-lf-slate"
                    />
                    <Button
                      onClick={async () => {
                        if (!manualNumbers.trim()) {
                          toast({
                            title: "No input",
                            description: "Please enter some numbers",
                            variant: "destructive",
                          });
                          return;
                        }
                        setIsProcessing(true);
                        const now = new Date();
                        setCapturedAt(now.toLocaleString());
                        try {
                          // Use vybe-reading for rich formatted readings
                          const { data, error } = await supabase.functions.invoke("vybe-reading", {
                            body: {
                              inputs: [{ label: 'Numbers', value: manualNumbers }],
                              depth: 'standard'
                            },
                          });
                          if (error) throw error;
                          if (data?.reading) {
                            // Store the formatted markdown reading
                            setReadings([{
                              input_text: manualNumbers,
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
                            }]);

                            // Save to history
                            saveReading({
                              inputType: 'manual',
                              inputValue: manualNumbers,
                              reading: data.reading,
                            });

                            toast({
                              title: "Reading generated! 🌟",
                              description: `Your reading for ${manualNumbers} is ready`,
                            });
                          }
                        } catch (error) {
                          console.error("Error:", error);
                          toast({
                            title: "Processing failed",
                            description: error instanceof Error ? error.message : "Please try again",
                            variant: "destructive",
                          });
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      disabled={isProcessing}
                      className="w-full gap-2 bg-lf-gradient hover:shadow-glow"
                    >
                      <Hash className="h-4 w-4" />
                      {isProcessing ? "Generating..." : "Generate Reading"}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="voice">
              <VoiceAssistant
                onCommand={handleVoiceCommand}
                isActive={true}
                disabled={isProcessing}
              />
            </TabsContent>

            <TabsContent value="chat">
              <Card className="border-white/10 bg-lf-ink/60 backdrop-blur">
                <div className="flex h-[500px] flex-col">
                  <div className="border-b border-white/10 p-4">
                    <h3 className="font-display text-xl font-semibold text-white">
                      Chat with Lumen
                    </h3>
                    <p className="text-sm text-lf-slate">
                      Ask questions about your vyberology readings
                    </p>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    {chatMessages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-center">
                        <div>
                          <Sparkles className="mx-auto mb-3 h-12 w-12 text-lf-violet" />
                          <p className="text-lf-slate">Start a conversation about your readings</p>
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg p-4 ${
                            msg.role === 'user'
                              ? 'ml-8 bg-lf-violet/20 text-white'
                              : 'mr-8 bg-lf-midnight/50 text-white'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-white/10 p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask a question..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChat();
                          }
                        }}
                        className="border-lf-violet/30 bg-lf-midnight/50 text-white placeholder:text-lf-slate"
                        disabled={isProcessing}
                      />
                      <Button
                        onClick={handleSendChat}
                        disabled={isProcessing || !chatInput.trim()}
                        className="gap-2 bg-lf-gradient hover:shadow-glow"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Capture - Recurring Numbers */}
          <Card className="mb-6 border-lf-aurora/30 bg-lf-gradient/50 p-6 backdrop-blur shadow-glow relative z-10">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-lf-aurora" />
              <h3 className="font-display text-xl font-semibold text-white">Universe Signals</h3>
            </div>
            <p className="text-sm text-white/80 mb-4">Quick capture common frequency patterns - strong guidance from the universe</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['11:11', '222', '333', '444', '555', '777', '888', '1111'].map((pattern) => (
                <Button
                  key={pattern}
                  onClick={async () => {
                    setIsProcessing(true);
                    setCapturedAt(new Date().toLocaleString());
                    try {
                      const { data, error } = await supabase.functions.invoke("vybe-reading", {
                        body: {
                          inputs: [{ label: 'Frequency Pattern', value: pattern }],
                          depth: 'standard'
                        },
                      });
                      if (error) throw error;
                      if (data?.reading) {
                        setReadings([{
                          input_text: pattern,
                          normalized_number: '',
                          numerology_data: {
                            headline: `Universe Signal: ${pattern}`,
                            keywords: [],
                            guidance: data.reading
                          },
                          chakra_data: {
                            name: '',
                            element: '',
                            focus: '',
                            color: '#A78BFA'
                          }
                        }]);

                        // Save to history
                        saveReading({
                          inputType: 'pattern',
                          inputValue: pattern,
                          reading: data.reading,
                        });

                        toast({
                          title: "Signal captured! ✨",
                          description: `Reading for ${pattern}`,
                        });
                      }
                    } catch (error) {
                      console.error("Error:", error);
                      toast({
                        title: "Processing failed",
                        description: error instanceof Error ? error.message : "Please try again",
                        variant: "destructive",
                      });
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                  className="bg-white/90 hover:bg-white text-lf-indigo font-bold text-lg h-14 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105"
                >
                  {pattern}
                </Button>
              ))}
            </div>
          </Card>

          {/* Numerology Tips */}
          <Card className="mb-6 border-lf-violet/30 bg-lf-midnight/50 p-6 backdrop-blur relative z-10">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-lf-violet" />
              <h3 className="font-display text-xl font-semibold text-white">Frequency Guidance</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-lf-ink/40 p-4 border border-lf-aurora/20 hover:border-lf-aurora/50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-lf-aurora/20 p-2">
                    <Clock className="h-5 w-5 text-lf-aurora" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Timing Patterns</h4>
                    <p className="text-sm text-lf-slate">
                      Repeating numbers in time (11:11, 22:22) are powerful synchronicity markers
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-lf-ink/40 p-4 border border-lf-violet/20 hover:border-lf-violet/50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-lf-violet/20 p-2">
                    <Hash className="h-5 w-5 text-lf-violet" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Angel Numbers</h4>
                    <p className="text-sm text-lf-slate">
                      Sequences like 333, 444, 555 carry specific messages from the universe
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-lf-ink/40 p-4 border border-lf-indigo/20 hover:border-lf-indigo/50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-lf-indigo/20 p-2">
                    <Sparkles className="h-5 w-5 text-lf-indigo" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Master Numbers</h4>
                    <p className="text-sm text-lf-slate">
                      11, 22, 33 are master numbers with amplified spiritual significance
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-lf-ink/40 p-4 border border-lf-aurora/20 hover:border-lf-aurora/50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-lf-aurora/20 p-2">
                    <ImageIcon className="h-5 w-5 text-lf-aurora" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Daily Captures</h4>
                    <p className="text-sm text-lf-slate">
                      Screenshot numbers you encounter - license plates, receipts, timestamps
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Results */}
          {readings.length > 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-lf-slate">Captured at {capturedAt}</p>
              </div>

              {readings.map((reading, index) => (
                <Card
                  key={index}
                  className="border-lf-violet/30 bg-lf-ink/60 p-8 backdrop-blur transition-all hover:border-lf-violet hover:shadow-glow"
                >
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {reading.numerology_data.guidance}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GetVybe;
