import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveReading } from "@/lib/readingHistory";
import { capturePhoto, pickPhoto, PermissionStatus } from "@/lib/permissions";
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

interface UseImageProcessingReturn {
  isProcessing: boolean;
  processingStep: string;
  isInCooldown: boolean;
  selectedImage: File | null;
  previewUrl: string | null;
  reading: Reading | null;
  capturedAt: string;
  cameraPermissionStatus: PermissionStatus;
  setCameraPermissionStatus: (status: PermissionStatus) => void;
  handleCameraCapture: () => Promise<void>;
  handlePickPhoto: () => Promise<void>;
  processImage: (imageFile: File) => Promise<void>;
}

export function useImageProcessing(
  onSuccess?: (readings: Reading[]) => void,
  onError?: (error: { title: string; message: string }) => void,
  onPermissionDenied?: () => void
): UseImageProcessingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [capturedAt, setCapturedAt] = useState<string>("");
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<PermissionStatus>('prompt');

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
      onPermissionDenied?.();
      return;
    }

    try {
      console.log('[OCR] Starting camera capture...');
      const result = await capturePhoto();

      if (!result.success) {
        if (result.error && !result.error.includes('cancel')) {
          console.error('[OCR] Camera capture failed:', result.error);
          onError?.({
            title: "Camera Error",
            message: result.error,
          });

          if (result.error.includes('denied')) {
            setCameraPermissionStatus('denied');
            onPermissionDenied?.();
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
      onError?.({
        title: "Camera failed",
        message: "Unable to capture photo",
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
          onError?.({
            title: "Error",
            message: result.error,
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
      onError?.({
        title: "Selection failed",
        message: "Unable to pick image",
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

        // Clear the preview after successful processing
        setPreviewUrl(null);
        setSelectedImage(null);
        setProcessingStep("");

        console.log('[OCR] ========== OCR Process Complete ==========');
        
        onSuccess?.(data.readings);
      } else {
        console.warn('[OCR] No readings found in response');
        onError?.({
          title: "No numbers detected",
          message: "Try an image with visible numbers, times, or patterns",
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

      onError?.({ title: errorTitle, message: errorMessage });
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

  return {
    isProcessing,
    processingStep,
    isInCooldown,
    selectedImage,
    previewUrl,
    reading,
    capturedAt,
    cameraPermissionStatus,
    setCameraPermissionStatus,
    handleCameraCapture,
    handlePickPhoto,
    processImage,
  };
}
