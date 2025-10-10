import { supabase } from "@/integrations/supabase/client";

export type DepthMode = "lite" | "standard" | "deep";

export async function generateReading(input: {
  fullName: string;
  dobISO?: string;
  inputs: Array<{ label: string; value: string | number }>;
  numbers?: {
    lifePath?: { value: number; isMaster?: boolean };
    expression?: { value: number; isMaster?: boolean };
    soulUrge?: { value: number; isMaster?: boolean };
    personality?: { value: number; isMaster?: boolean };
  };
  includeChakra?: boolean;
  depth?: DepthMode;
  model?: string;
}) {
  // Call the secure Supabase Edge Function instead of OpenAI directly
  const { data, error } = await supabase.functions.invoke('generate-reading', {
    body: input
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(`Failed to generate reading: ${error.message}`);
  }

  if (!data || !data.reading) {
    throw new Error('No reading data returned from server');
  }

  return data.reading;
}
