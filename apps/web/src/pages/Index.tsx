import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Calculator, Hash, BookOpen, Heart, Clock, Settings, Calendar, Camera, Image as ImageIcon, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import vybeLogo from "@/assets/vybe-logo.png";
import { Footer } from "@/components/Footer";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { saveReading } from "@/lib/readingHistory";
import { capturePhoto, pickPhoto, checkCameraPermission, requestCameraPermission, PermissionStatus } from "@/lib/permissions";
import { PermissionPrompt } from "@/components/PermissionPrompt";
import { captureError } from "@/lib/sentry";

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<PermissionStatus>('prompt');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [textInput, setTextInput] = useState<string>("");
  const [processingStep, setProcessingStep] = useState<string>("");
  const [isInCooldown, setIsInCooldown] = useState(false);

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
      setCameraPermissionStatus(cameraResult.status);
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

  /**
   * Compress image if it's too large
   */
  const compressImage = async (file: File, maxSizeMB: number = 5): Promise<File> => {
    console.log('[OCR] Original image size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

    // If file is already small enough, return it
    if (file.size <= maxSizeMB * 1024 * 1024) {
      console.log('[OCR] Image size is acceptable, no compression needed');
      return file;
    }

    console.log('[OCR] Image is too large, compressing...');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions (max 1920x1920)
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try different quality levels until we get under maxSizeMB
          const tryCompress = (quality: number) => {
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedSize = blob.size / 1024 / 1024;
              console.log('[OCR] Compressed to:', compressedSize.toFixed(2), 'MB at quality', quality);

              if (compressedSize <= maxSizeMB || quality <= 0.3) {
                const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                resolve(compressedFile);
              } else {
                // Try lower quality
                tryCompress(quality - 0.1);
              }
            }, 'image/jpeg', quality);
          };

          tryCompress(0.8);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = async () => {
    if (isInCooldown) {
      console.log('[OCR] Camera capture blocked - in cooldown period');
      return;
    }

    if (cameraPermissionStatus === 'denied') {
      setShowPermissionPrompt(true);
      return;
    }

    try {
      console.log('[OCR] Starting camera capture...');
      const result = await capturePhoto();

      if (!result.success) {
        if (result.error && !result.error.includes('cancel')) {
          console.error('[OCR] Camera capture failed:', result.error);
          toast({
            title: "Camera Error",
            description: result.error,
            variant: "destructive",
            duration: 5000,
          });

          if (result.error.includes('denied')) {
            setCameraPermissionStatus('denied');
            setShowPermissionPrompt(true);
          }
        }
        return;
      }

      if (result.data) {
        console.log('[OCR] Camera capture successful, processing image...');
        const response = await fetch(result.data);
        const blob = await response.blob();
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

        setSelectedImage(file);
        setPreviewUrl(result.data);
        setCameraPermissionStatus('granted');

        // Automatically process the image
        await processImage(file);
      }
    } catch (error) {
      console.error("[OCR] Camera capture error:", error);
      toast({
        title: "Camera failed",
        description: "Unable to capture photo",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handlePickPhoto = async () => {
    if (isInCooldown) {
      console.log('[OCR] Photo picker blocked - in cooldown period');
      return;
    }

    try {
      console.log('[OCR] Opening photo picker...');
      const result = await pickPhoto();

      if (!result.success) {
        if (result.error && !result.error.includes('cancel')) {
          console.error('[OCR] Photo picker failed:', result.error);
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
            duration: 5000,
          });
        }
        return;
      }

      if (result.data) {
        console.log('[OCR] Photo selected, processing image...');
        const response = await fetch(result.data);
        const blob = await response.blob();
        const file = new File([blob], "selected-image.jpg", { type: "image/jpeg" });

        setSelectedImage(file);
        setPreviewUrl(result.data);

        // Automatically process the image
        await processImage(file);
      }
    } catch (error) {
      console.error("[OCR] Photo picker error:", error);
      toast({
        title: "Selection failed",
        description: "Unable to pick image",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const processImage = async (imageFile: File) => {
    const startTime = Date.now();
    console.log('[OCR] ========== Starting OCR Process ==========');
    console.log('[OCR] File name:', imageFile.name);
    console.log('[OCR] File type:', imageFile.type);
    console.log('[OCR] File size:', (imageFile.size / 1024 / 1024).toFixed(2), 'MB');

    setIsProcessing(true);
    setProcessingStep("Preparing image...");
    setCapturedAt(new Date().toLocaleString());

    try {
      // Step 1: Compress image if needed
      setProcessingStep("Optimizing image size...");
      let processedFile = imageFile;

      try {
        processedFile = await compressImage(imageFile, 5);
        console.log('[OCR] Final file size:', (processedFile.size / 1024 / 1024).toFixed(2), 'MB');
      } catch (compressionError) {
        console.error('[OCR] Image compression failed:', compressionError);
        // Continue with original file if compression fails
        console.log('[OCR] Continuing with original file...');
      }

      // Step 2: Upload to OCR service
      setProcessingStep("Uploading to AI vision...");
      console.log('[OCR] Creating FormData and uploading...');

      const formData = new FormData();
      formData.append("screenshot", processedFile);

      console.log('[OCR] Calling Supabase OCR function...');
      const { data, error } = await supabase.functions.invoke("ocr", {
        body: formData,
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('[OCR] Response received in', elapsed, 'seconds');

      if (error) {
        console.error("[OCR] Supabase function error:", error);

        // Report to Sentry
        captureError(error, {
          context: 'OCR Processing - Supabase Function Error',
          level: 'error',
          tags: {
            feature: 'ocr',
            operation: 'invoke-function',
          },
          extra: {
            fileSize: processedFile.size,
            fileName: processedFile.name,
            fileType: processedFile.type,
            errorData: data,
          },
        });

        throw new Error(data?.message || "OCR processing failed");
      }

      // Step 3: Process results
      setProcessingStep("Analyzing numbers...");
      console.log('[OCR] OCR response:', data);

      if (data.error) {
        console.error('[OCR] API error in response:', data.error, data.message);

        // Report to Sentry
        captureError(new Error(data.error), {
          context: 'OCR Processing - API Error',
          level: 'error',
          tags: {
            feature: 'ocr',
            operation: 'api-response',
            status: data.status,
          },
          extra: {
            fileSize: processedFile.size,
            errorMessage: data.message,
            errorDetails: data.details,
          },
        });

        throw new Error(data.message || data.error);
      }

      if (data.readings && data.readings.length > 0) {
        console.log('[OCR] Success! Found', data.readings.length, 'readings');

        // Show the first reading on the index page
        const firstReading = data.readings[0];
        setReading(firstReading);

        // Save all readings to history
        data.readings.forEach((r: Reading) => {
          console.log('[OCR] Saving reading to history:', r.input_text);
          saveReading({
            inputType: 'image',
            inputValue: r.input_text,
            reading: r.numerology_data.guidance,
          });
        });

        toast({
          title: "Vybe captured! 🌟",
          description: `Found ${data.readings.length} frequency signal(s)`,
          duration: 4000,
        });

        // Clear the preview after successful processing
        setPreviewUrl(null);
        setSelectedImage(null);
        setProcessingStep("");

        console.log('[OCR] ========== OCR Process Complete ==========');
      } else {
        console.warn('[OCR] No readings found in response');
        toast({
          title: "No numbers detected",
          description: "Try an image with visible numbers, times, or patterns",
          variant: "destructive",
          duration: 5000,
        });

        setProcessingStep("");
      }
    } catch (error) {
      console.error("[OCR] ========== OCR Process Failed ==========");
      console.error("[OCR] Error details:", error);

      let errorTitle = "Processing failed";
      let errorMessage = "Please try again";

      if (error instanceof Error) {
        console.error("[OCR] Error message:", error.message);
        console.error("[OCR] Error stack:", error.stack);

        // Parse different error types
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          errorTitle = "Timeout Error";
          errorMessage = "Image processing took too long. Try a smaller image or check your connection.";
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorTitle = "Service Error";
          errorMessage = "OCR service not found. Please contact support.";
        } else if (error.message.includes('too large') || error.message.includes('size')) {
          errorTitle = "Image Too Large";
          errorMessage = "Image file is too large. Please try a smaller image.";
        } else if (error.message.includes('OpenAI') || error.message.includes('API')) {
          errorTitle = "AI Service Error";
          errorMessage = error.message + " - Please try again later.";
        } else if (error.message.includes('encoding')) {
          errorTitle = "Image Format Error";
          errorMessage = "Failed to process image format. Try a different image.";
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
          errorTitle = "Service Limit Reached";
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else {
          errorMessage = error.message;
        }

        // Report to Sentry
        captureError(error, {
          context: 'OCR Processing - Complete Failure',
          level: 'error',
          tags: {
            feature: 'ocr',
            operation: 'process-image',
            errorType: errorTitle,
          },
          extra: {
            fileSize: imageFile.size,
            fileName: imageFile.name,
            fileType: imageFile.type,
            errorMessage: error.message,
            elapsed: ((Date.now() - startTime) / 1000).toFixed(2) + 's',
          },
        });
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });

      setProcessingStep("");

      // Start cooldown to prevent rapid retries
      setIsInCooldown(true);
      console.log('[OCR] Starting 3-second cooldown...');
      setTimeout(() => {
        setIsInCooldown(false);
        console.log('[OCR] Cooldown complete');
      }, 3000);
    } finally {
      setIsProcessing(false);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('[OCR] Total processing time:', elapsed, 'seconds');
    }
  };

  const handleRequestCameraPermission = async () => {
    const result = await requestCameraPermission();
    setCameraPermissionStatus(result.status);
    setShowPermissionPrompt(false);

    if (result.status === 'granted') {
      toast({
        title: "Permission granted",
        description: "You can now use camera features"
      });
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      toast({
        title: "No input",
        description: "Please enter numbers or text",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setCapturedAt(new Date().toLocaleString());

    try {
      const { data, error } = await supabase.functions.invoke("vybe-reading", {
        body: {
          inputs: [{ label: 'Input', value: textInput }],
          depth: 'standard'
        },
      });

      if (error) throw error;

      if (data?.reading) {
        const newReading = {
          input_text: textInput,
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
          inputType: 'manual',
          inputValue: textInput,
          reading: data.reading,
        });

        // Clear input after successful submission
        setTextInput("");

        toast({
          title: "Reading generated! 🌟",
          description: "Your vybe reading is ready",
        });
      }
    } catch (error) {
      console.error("Error processing text:", error);
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
      {/* Permission Prompt Modal */}
      {showPermissionPrompt && (
        <PermissionPrompt
          permissionType="camera"
          status={cameraPermissionStatus}
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
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleTextSubmit();
                        }
                      }}
                      disabled={isProcessing}
                      className="min-h-24 border-lf-violet/30 bg-lf-midnight/50 text-white placeholder:text-lf-slate resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleTextSubmit}
                    disabled={isProcessing || !textInput.trim()}
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
                {processingStep && (
                  <div className="text-sm text-lf-aurora animate-pulse">
                    {processingStep}
                  </div>
                )}

                {/* Cooldown Message */}
                {isInCooldown && !isProcessing && (
                  <div className="text-sm text-lf-violet">
                    Please wait before trying again...
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={handleCameraCapture}
                    disabled={isProcessing || isInCooldown}
                    variant="outline"
                    className="gap-2 border-lf-aurora text-lf-aurora hover:bg-lf-aurora/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Camera className="h-4 w-4" />
                    {isInCooldown ? "Wait..." : "Take Photo"}
                  </Button>
                  <Button
                    onClick={handlePickPhoto}
                    disabled={isProcessing || isInCooldown}
                    variant="outline"
                    className="gap-2 border-lf-violet text-lf-violet hover:bg-lf-violet/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {isInCooldown ? "Wait..." : "Choose Image"}
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
