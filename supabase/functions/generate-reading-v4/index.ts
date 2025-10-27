import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { withCors, requireJwt } from "../../apps/web/supabase/functions/_shared/security.ts";
import { withTiming } from "../../apps/web/supabase/functions/_shared/telemetry.ts";
import { ServerTimer } from "../../apps/web/supabase/functions/_lib/serverTiming.ts";
import type { Result } from "@vybe/reading-engine";

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

type Reading = GeneratedReading['reading'];
type ReadingErrorCode = 'DISABLED' | 'INVALID_INPUT' | 'NOT_IMPLEMENTED' | 'INTERNAL';
type ReadingError = { code: ReadingErrorCode; message: string };
serve(
  withCors(
    withTiming(async (req) => {
      const timer = new ServerTimer();
      const auth = requireJwt(req);
      if (!auth.ok) {
        return auth.response;
      }

      const headersInit = { "Content-Type": "application/json" } as const;
      const respond = (payload: unknown, status: number) => {
        const headers = new Headers(headersInit);
        timer.apply(headers);
        return new Response(JSON.stringify(payload), { status, headers });
      };

      const isEnabled = (Deno.env.get("V4_ENABLED") ?? "false").toLowerCase() === "true";

      if (!isEnabled) {
        const payload: Result<never, ReadingError> = {
          ok: false,
          error: { code: "DISABLED", message: "V4 gated for beta" },
        };
        return respond(payload, 200);
      }

      try {
        const parseSpan = timer.start("parse");
        const { input, explain = false, userId }: GenerateReadingRequest = await req.json();
        timer.end(parseSpan);

        if (!input?.raw) {
          const payload: Result<never, ReadingError> = {
            ok: false,
            error: { code: "INVALID_INPUT", message: "Missing required field: input.raw" },
          };
          return respond(payload, 400);
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const renderSpan = timer.start("render");
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
        timer.end(renderSpan);

        if (userId) {
          const dbSpan = timer.start("db");
          const { error: dbError } = await supabase.from("readings").insert({
            user_id: userId,
            raw_input: input.raw,
            context: input.context,
            entry_no: input.entryNo,
            reading_data: mockReading.reading,
            created_at: new Date().toISOString(),
          });
          timer.end(dbSpan);

          if (dbError) {
            console.error("Failed to store reading:", dbError);
          }
        }

        const payload: Result<Reading, ReadingError> = {
          ok: true,
          value: mockReading.reading,
        };
        return respond(payload, 200);
      } catch (error) {
        console.error("Error generating reading:", error);
        const payload: Result<never, ReadingError> = {
          ok: false,
          error: {
            code: "INTERNAL",
            message: error instanceof Error ? error.message : "Internal server error",
          },
        };
        return respond(payload, 500);
      }
    })
  )
);
