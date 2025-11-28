import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveReading } from "@/lib/readingHistory";

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
      const { data, error } = await supabase.functions.invoke("vybe-reading", {
        body: {
          inputs: [{ label: 'Input', value: textInput }],
          depth: 'standard'
        },
      });

      if (error) throw error;

      if (data?.reading) {
        const newReading: Reading = {
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

        onSuccess?.(newReading);
      }
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
