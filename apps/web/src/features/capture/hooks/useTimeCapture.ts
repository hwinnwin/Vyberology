import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveReading } from "@/lib/readingHistory";
import { callVybeReading } from "@/lib/vybeApi";

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

interface UseTimeCaptureReturn {
  isProcessing: boolean;
  capturedAt: string;
  reading: Reading | null;
  captureTime: () => Promise<void>;
}

export function useTimeCapture(
  onSuccess?: (reading: Reading) => void,
  onError?: (error: Error) => void
): UseTimeCaptureReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [capturedAt, setCapturedAt] = useState<string>("");

  const captureTime = async () => {
    setIsProcessing(true);
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    setCapturedAt(now.toLocaleString());

    try {
      const readingText = await callVybeReading(
        [{ label: 'Time', value: timeString }],
        'standard'
      );

      const newReading: Reading = {
        input_text: timeString,
        normalized_number: '',
        numerology_data: {
          headline: 'Vyberology Reading',
          keywords: [],
          guidance: readingText
        },
        chakra_data: {
          name: '',
          element: '',
          focus: '',
          color: '#C4A265'
        }
      };

      setReading(newReading);

      saveReading({
        inputType: 'time',
        inputValue: timeString,
        reading: readingText,
      });

      onSuccess?.(newReading);
    } catch (error) {
      console.error("Error processing time:", error);
      onError?.(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    capturedAt,
    reading,
    captureTime,
  };
}
