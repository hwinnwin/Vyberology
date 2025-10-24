// added by Claude Code (Stage B - IP Protection)
// Client SDK for server-side V4 reading generation via Edge Function

import { createClient } from "@supabase/supabase-js";

const V4_FLAG = (import.meta.env.VITE_V4_ENABLED ?? "false").toLowerCase() === "true";

interface CaptureInput {
  raw: string;
  context?: string;
  entryNo?: number;
}

interface GeneratedReading {
  reading: {
    header: { title: string; theme: string[] };
    anchorFrame: Record<string, string>;
    numerology: {
      tokens: unknown[];
      flow: number[];
      coreFrequency: number;
      notes: string[];
    };
    layeredMeaning: Array<{ segment: string; essence: string; message: string }>;
    energyMessage: string;
    alignmentSummary: Array<{ focus: string; number: number; tone: string; guidance: string }>;
    resonance: { elements: string[]; chakras: string[]; blurb: string };
    guidanceAspect: { area: string; blurb: string };
    essenceSentence: string;
  };
  explain?: unknown;
}

export interface GenerateReadingOptions {
  explain?: boolean;
  storeInDatabase?: boolean;
}

export class ReadingV4Client {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    if (!V4_FLAG) {
      throw new Error("Reading V4 client requested while V4 feature flag is disabled.");
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Generate a V4 reading server-side (protects phrasebook IP)
   */
  async generateReading(
    input: CaptureInput,
    options: GenerateReadingOptions = {}
  ): Promise<GeneratedReading> {
    if (!V4_FLAG) {
      throw new Error("V4 reading generation is currently disabled.");
    }

    const { explain = false, storeInDatabase = true } = options;

    // Get current user ID if storing in database
    let userId: string | undefined;
    if (storeInDatabase) {
      const { data: { user } } = await this.supabase.auth.getUser();
      userId = user?.id;
    }

    // Call Edge Function
    const { data, error } = await this.supabase.functions.invoke<GeneratedReading>(
      "generate-reading-v4",
      {
        body: {
          input,
          explain,
          userId,
        },
      }
    );

    if (error) {
      throw new Error(`Failed to generate reading: ${error.message}`);
    }

    if (!data) {
      throw new Error("No reading data returned from server");
    }

    return data;
  }

  /**
   * Fetch user's reading history
   */
  async getReadingHistory(limit = 50, offset = 0) {
    const { data, error } = await this.supabase
      .from("readings")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch reading history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific reading by ID
   */
  async getReading(readingId: string) {
    const { data, error } = await this.supabase
      .from("readings")
      .select("*")
      .eq("id", readingId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch reading: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a reading
   */
  async deleteReading(readingId: string) {
    const { error } = await this.supabase
      .from("readings")
      .delete()
      .eq("id", readingId);

    if (error) {
      throw new Error(`Failed to delete reading: ${error.message}`);
    }
  }
}

// Singleton instance (initialized with env vars)
let clientInstance: ReadingV4Client | null = null;

export function getReadingV4Client(): ReadingV4Client {
  if (!V4_FLAG) {
    throw new Error("V4 reading service is disabled.");
  }

  if (!clientInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey =
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    clientInstance = new ReadingV4Client(supabaseUrl, supabaseKey);
  }

  return clientInstance;
}

export const isReadingV4Enabled = () => V4_FLAG;

// React hook example (optional)
export function useReadingV4() {
  if (!V4_FLAG) {
    throw new Error("useReadingV4 invoked while V4 readings are disabled.");
  }

  const client = getReadingV4Client();

  const generateReading = async (
    input: CaptureInput,
    options?: GenerateReadingOptions
  ) => {
    return client.generateReading(input, options);
  };

  const getHistory = async (limit?: number, offset?: number) => {
    return client.getReadingHistory(limit, offset);
  };

  return {
    generateReading,
    getHistory,
    getReading: client.getReading.bind(client),
    deleteReading: client.deleteReading.bind(client),
  };
}
