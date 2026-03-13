import { useState } from "react";
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

interface UseTextInputReturn {
  textInput: string;
  setTextInput: (value: string) => void;
  isProcessing: boolean;
  capturedAt: string;
  reading: Reading | null;
  submitText: () => Promise<void>;
}

export function useTextInput(
  onSuccess?: (reading: Reading) => void,
  onError?: (error: Error) => void,
  onEmptyInput?: () => void
): UseTextInputReturn {
  const [textInput, setTextInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [capturedAt, setCapturedAt] = useState<string>("");

  const submitText = async () => {
    if (!textInput.trim()) {
      onEmptyInput?.();
      return;
    }

    setIsProcessing(true);
    setCapturedAt(new Date().toLocaleString());

    try {
      const readingText = await callVybeReading(
        [{ label: 'Input', value: textInput }],
        'standard'
      );

      const newReading: Reading = {
        input_text: textInput,
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
        inputType: 'manual',
        inputValue: textInput,
        reading: readingText,
      });

      setTextInput("");

      onSuccess?.(newReading);
    } catch (error) {
      console.error("Error processing text:", error);
      onError?.(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    textInput,
    setTextInput,
    isProcessing,
    capturedAt,
    reading,
    submitText,
  };
}
