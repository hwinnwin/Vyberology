/**
 * Compare Edge Function
 * Generates a compatibility / pair reading from two people's names + DOBs.
 * Returns a PairReading matching the client-side type.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withCors } from "../_shared/security.ts";
import { withTiming } from "../_shared/telemetry.ts";
import { compareProfiles } from "../_shared/numerology.ts";

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
        const { aName, aDob, bName, bDob } = await req.json();

        if (!aName || typeof aName !== "string" || aName.trim().length < 2) {
          return new Response(
            JSON.stringify({ error: "aName is required (min 2 characters)" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (!aDob || typeof aDob !== "string") {
          return new Response(
            JSON.stringify({ error: "aDob is required (YYYY-MM-DD format)" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (!bName || typeof bName !== "string" || bName.trim().length < 2) {
          return new Response(
            JSON.stringify({ error: "bName is required (min 2 characters)" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (!bDob || typeof bDob !== "string") {
          return new Response(
            JSON.stringify({ error: "bDob is required (YYYY-MM-DD format)" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = compareProfiles(
          aName.trim(),
          aDob.trim(),
          bName.trim(),
          bDob.trim()
        );

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error generating compatibility reading:", error);
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
