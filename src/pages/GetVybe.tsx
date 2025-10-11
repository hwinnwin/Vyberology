import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, Clock, Image as ImageIcon, Send, Hash, Camera as CameraIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionPrompt } from "@/components/PermissionPrompt";
import {
  checkCameraPermission,
  requestCameraPermission,
  checkMicrophonePermission,
  requestMicrophonePermission,
  capturePhoto,
  pickPhoto,
  PermissionStatus
} from "@/lib/permissions";
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
      const formData = new FormData();
      formData.append("screenshot", selectedImage);

      const { data, error } = await supabase.functions.invoke("ocr", {
        body: formData,
      });

      if (error) throw error;

      if (data.readings && data.readings.length > 0) {
        setReadings(data.readings);
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
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Please try again",
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
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <img src={vybeLogo} alt="Vybe Logo" className="h-12" />
              <h1 className="font-display text-5xl font-bold text-white">Get Vybe</h1>
            </div>
            <p className="text-lg text-lf-slate">
              Capture the current time frequency or upload an image with numbers and patterns
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
              className="inline-flex h-auto min-w-[220px] flex-col items-center gap-3 rounded-full bg-amber-400 px-5 py-4 font-semibold text-slate-900 shadow transition-colors duration-200 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-violet-400 active:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-300 dark:hover:bg-amber-400 dark:text-slate-900 w-full sm:w-auto"
            >
              {isProcessing ? "Capturing..." : (
                <>
                  <span className="text-lg">What's the</span>
                  <span className="grid place-items-center rounded-full bg-white p-2 shadow-sm">
                    <img src={vybeLogo} alt="Vybe" className="h-10" />
                  </span>
                </>
              )}
            </Button>
          </Card>

          {/* Tabs for different input methods */}
          <Tabs defaultValue="image" className="mb-8">
            <TabsList className="grid w-full grid-cols-3 bg-lf-ink/60">
              <TabsTrigger value="image">Upload Image</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
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
                          <label htmlFor="image-upload">
                            <Button variant="outline" className="gap-2 border-lf-violet text-lf-violet hover:bg-lf-violet/10">
                              <ImageIcon className="h-5 w-5" />
                              Choose Image
                            </Button>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
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
                          <label htmlFor="image-upload-2">
                            <Button variant="outline" className="gap-2 border-lf-violet text-lf-violet">
                              <Upload className="h-4 w-4" />
                              Change Image
                            </Button>
                            <input
                              id="image-upload-2"
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
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
                          const { data, error } = await supabase.functions.invoke("vybe-reading", {
                            body: {
                              inputs: [{ label: 'Numbers', value: manualNumbers }],
                              depth: 'standard'
                            },
                          });
                          if (error) throw error;
                          if (data?.reading) {
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
                            toast({
                              title: "Reading generated! 🌟",
                              description: "Your vyberology reading is ready",
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
