import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withCors, requireJwt } from "../_shared/security.ts";
import { withTiming } from "../_shared/telemetry.ts";
import { ServerTimer } from "../_lib/serverTiming.ts";

export type DepthMode = "lite" | "standard" | "deep";

interface GenerateReadingRequest {
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
}

serve(
  withCors(
    withTiming(async (req) => {
      const timer = new ServerTimer();
      const auth = requireJwt(req);
      if (!auth.ok) {
        return auth.response;
      }

      try {
        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiKey) {
          return jsonResponse(timer, { error: "OpenAI API key not configured" }, 500);
        }

        const parseSpan = timer.start("parse");
        const requestData: GenerateReadingRequest = await req.json();
        timer.end(parseSpan);

        const {
          fullName,
          dobISO,
          inputs,
          numbers,
          includeChakra = false,
          depth = "standard",
          model,
        } = requestData;

        if (!fullName) {
          return jsonResponse(timer, { error: "fullName is required" }, 400);
        }

        const renderSpan = timer.start("render");
        const messages = buildReadingMessages({
          fullName,
          dobISO,
          inputs,
          numbers,
          includeChakra,
          depth,
        });
        timer.end(renderSpan);

        const selectedModel = model || (depth === "deep" ? "gpt-4o-mini" : "gpt-4o-mini");
        const maxTokens = depth === "deep" ? 1200 : depth === "lite" ? 400 : 700;

        const openaiSpan = timer.start("openai");
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            temperature: 0.6,
            max_tokens: maxTokens,
            messages,
          }),
        });

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          console.error("OpenAI API error:", errorText);
          timer.end(openaiSpan);
          return jsonResponse(timer, { error: `OpenAI API error: ${openaiResponse.status}` }, openaiResponse.status);
        }

        const data = await openaiResponse.json();
        timer.end(openaiSpan);
        const reading = (data.choices[0]?.message?.content || "No output.").trim();

        return jsonResponse(timer, { reading });
      } catch (error) {
        console.error("Error in generate-reading function:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return jsonResponse(timer, { error: errorMessage }, 500);
      }
    })
  )
);

// Helper function to build messages for OpenAI
function buildReadingMessages(params: {
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
}) {
  const depth = params.depth ?? "standard";
  const lengthHint =
    depth === "lite" ? "Keep to ~180–250 words." :
    depth === "deep" ? "Allow ~700–1000 words; include all sections with detail." :
    "Keep to ~350–500 words; include all sections.";

  // System message with Lumen tone
  const systemMessage = {
    role: "system",
    content: `You are Lumen, the voice of Vyberology. You interpret numerology through a modern, grounded lens — blending ancient wisdom with practical insight. Your tone is warm but clear, poetic but never vague. You speak in metaphors that land, not float. You help people see the patterns in their life's frequency and translate those into actionable awareness.

Key principles:
- Numerology is a framework, not fortune-telling
- Master numbers (11, 22, 33) carry amplified energy but also amplified challenge
- Every number has light and shadow expressions
- Readings should feel personal, not generic
- Use concrete imagery and relatable examples
- Focus on empowerment and self-awareness, not prediction`
  };

  // User prompt with reading request
  const userMessage = {
    role: "user",
    content: `
Generate a Vyberology reading in the exact sectioned format.
Name: ${params.fullName}
DOB: ${params.dobISO ?? "—"}
Captured Inputs:
${params.inputs.map(i => `- ${i.label}: ${i.value}`).join("\n")}

Known Numbers (modern method, keep masters):
${params.numbers ? JSON.stringify(params.numbers) : "Compute from DOB if present; otherwise infer from inputs."}

Output rules:
- Use the section headers exactly.
- Show working for Numerology Breakdown.
- Keep master 11/22/33 un-reduced at final step.
- Prefer "Insight" wording in place of "Applied Cue".
- ${lengthHint}
`.trim()
  };

  return [systemMessage, userMessage];
}

function jsonResponse(timer: ServerTimer, body: unknown, status = 200): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  timer.apply(headers);
  return new Response(JSON.stringify(body), { status, headers });
}
