// added by Claude Code (Stage B - IP Protection)
// Supabase Edge Function for server-side V4 reading generation
// Protects phrasebook + deterministic logic from client exposure

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Import types (these will be bundled from private core)
interface CaptureInput {
  raw: string;
  context?: string;
  entryNo?: number;
}

interface GenerateReadingRequest {
  input: CaptureInput;
  explain?: boolean;
  userId?: string;
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

// Response with CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request
    const { input, explain = false, userId }: GenerateReadingRequest = await req.json();

    // Validate input
    if (!input?.raw) {
      return new Response(
        JSON.stringify({ error: "Missing required field: input.raw" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role (for RLS bypass if needed)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // TODO: Import and call the actual V4 engine
    // This requires bundling @vybe/reading-core-private into the Edge Function
    // For now, returning mock response structure

    const mockReading: GeneratedReading = {
      reading: {
        header: {
          title: `Cycle IV Entry #${input.entryNo || 1} — ${input.raw}`,
          theme: ["Placeholder", "Implementation", "Pending"],
        },
        anchorFrame: { raw: input.raw },
        numerology: {
          tokens: [],
          flow: [5],
          coreFrequency: 5,
          notes: [],
        },
        layeredMeaning: [
          {
            segment: input.raw,
            essence: "Server-side generation active",
            message: "Stage B placeholder - full implementation pending",
          },
        ],
        energyMessage: "Edge Function operational - awaiting V4 engine integration",
        alignmentSummary: [
          { focus: "Change", number: 5, tone: "Freedom", guidance: "Adapt; don't cling." },
        ],
        resonance: {
          elements: ["Air 🜁", "Earth 🜃"],
          chakras: ["Root ❤️", "Solar Plexus 💛", "Throat 💙"],
          blurb: "Server-side processing ensures IP protection.",
        },
        guidanceAspect: {
          area: "Implementation",
          blurb: "Stage B: Edge Function scaffold complete, awaiting engine bundle.",
        },
        essenceSentence: `${input.raw} — server-side generation protects your IP.`,
      },
      explain: explain ? { note: "Explain mode placeholder" } : undefined,
    };

    // Optional: Store reading in database
    if (userId) {
      const { error: dbError } = await supabase.from("readings").insert({
        user_id: userId,
        raw_input: input.raw,
        context: input.context,
        entry_no: input.entryNo,
        reading_data: mockReading.reading,
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error("Failed to store reading:", dbError);
        // Continue anyway - reading generation succeeded
      }
    }

    return new Response(JSON.stringify(mockReading), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating reading:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
