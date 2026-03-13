/**
 * Read Edge Function
 * Generates a numerology reading from fullName + dob.
 * Returns a ReadingResult matching the client-side type.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withCors } from "../_shared/security.ts";
import { withTiming } from "../_shared/telemetry.ts";
import { generateReading } from "../_shared/numerology.ts";

serve(
  withCors(
    withTiming(async (req: Request) => {
      if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const { fullName, dob } = await req.json();

        if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
          return new Response(
            JSON.stringify({ error: "fullName is required (min 2 characters)" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        if (!dob || typeof dob !== "string") {
          return new Response(
            JSON.stringify({ error: "dob is required (YYYY-MM-DD format)" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = generateReading(fullName.trim(), dob.trim());

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error generating reading:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Internal server error",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    })
  )
);
