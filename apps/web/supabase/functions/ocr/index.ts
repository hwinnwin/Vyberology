import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCors, passesRateLimit } from "../_shared/security.ts";
import {
  prepareOcrResult,
  type OcrRequest,
  type OcrDeps,
  type Result,
  type OcrOk,
  type OcrErr,
} from "./handler.ts";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

serve(async (req) => {
  const { headers, allowed } = buildCors(req.headers.get("origin"));
  const jsonHeaders = { ...headers, ...JSON_HEADERS };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (!allowed) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  if (!(await passesRateLimit(req, "ocr"))) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
      status: 429,
      headers: jsonHeaders,
    });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const result = await prepareOcrResult({ runOcr }, payload);

  return respond(result, jsonHeaders);
});

function respond(result: Result<OcrOk, OcrErr>, headers: Record<string, string>) {
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: result.error.code === "BAD_REQUEST" ? 400 : 500,
      headers,
    });
  }
  return new Response(JSON.stringify(result.value), { status: 200, headers });
}

async function runOcr(payload: OcrRequest & { mode: "fast" | "accurate" }) {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = [
    "Extract ALL numbers from this image.",
    "Include times (11:11), percentages (75%), repeating numbers (222),",
    "phone numbers, license plates, prices, order IDs, etc.",
    "Return the numbers you see, one per line."
  ].join(" ");

  const model = payload.mode === "fast" ? "gpt-4o-mini" : "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${prompt}${payload.lang ? ` Language hint: ${payload.lang}.` : ""}` },
            { type: "image_url", image_url: { url: payload.imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${details}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const usage = data.usage ?? {};

  return {
    text,
    meta: {
      model,
      mode: payload.mode,
      usage,
    },
  };
}
