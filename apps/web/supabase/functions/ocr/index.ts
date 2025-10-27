import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCors, passesRateLimit } from "../_shared/security.ts";
import {
  prepareOcrResult,
  type OcrRequest,
  type OcrDeps,
  type OcrOk,
  type OcrErr,
} from "./handler.ts";
import type { Result } from "@vybe/reading-engine";
import { ServerTimer } from "../_lib/serverTiming.ts";
import { createLogger, extractRequestContext } from "../_shared/errorLogger.ts";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const environment = (Deno.env.get('ENV') || 'staging') as 'staging' | 'production';

  const logger = createLogger(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { environment, service: 'edge:function:ocr', requestId }
  );

  const timer = new ServerTimer();
  const { headers, allowed } = buildCors(req.headers.get("origin"));
  const jsonHeaders = { ...headers, ...JSON_HEADERS };

  if (req.method === "OPTIONS") {
    const h = new Headers(jsonHeaders);
    timer.apply(h);
    return new Response(null, { status: 204, headers: h });
  }

  if (!allowed) {
    await logger.warn('CORS origin not allowed', {
      code: 'CORS_ORIGIN_NOT_ALLOWED',
      details: { origin: req.headers.get("origin") },
      ...extractRequestContext(req),
    });
    const h = new Headers(jsonHeaders);
    timer.apply(h);
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: h,
    });
  }

  const rateSpan = timer.start("db");
  const withinLimit = await passesRateLimit(req, "ocr");
  timer.end(rateSpan);

  if (!withinLimit) {
    await logger.warn('Rate limit exceeded', {
      code: 'RATE_LIMIT_EXCEEDED',
      details: { endpoint: 'ocr' },
      ...extractRequestContext(req),
    });
    const h = new Headers(jsonHeaders);
    timer.apply(h);
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
      status: 429,
      headers: h,
    });
  }

  let payload: unknown;
  try {
    const parseSpan = timer.start("parse");
    payload = await req.json();
    timer.end(parseSpan);
  } catch (err) {
    await logger.warn('Invalid JSON payload', {
      code: 'INVALID_JSON',
      details: { error: err instanceof Error ? err.message : String(err) },
      ...extractRequestContext(req),
    });
    const h = new Headers(jsonHeaders);
    timer.apply(h);
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: h,
    });
  }

  try {
    const renderSpan = timer.start("render");
    const result = await prepareOcrResult(
      {
        runOcr: async (input) => {
          const span = timer.start("openai");
          try {
            return await runOcr(input, logger, req);
          } finally {
            timer.end(span);
          }
        },
      },
      payload
    );
    timer.end(renderSpan);

    return respond(result, jsonHeaders, timer);
  } catch (err) {
    await logger.error(
      err instanceof Error ? err.message : 'Unknown error occurred',
      {
        code: 'UNHANDLED_ERROR',
        details: {
          errorType: typeof err,
          stack: err instanceof Error ? err.stack : undefined,
        },
        ...extractRequestContext(req),
      }
    );
    const h = new Headers(jsonHeaders);
    timer.apply(h);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: h,
    });
  }
});

function respond(result: Result<OcrOk, OcrErr>, headersInit: Record<string, string>, timer: ServerTimer) {
  const headers = new Headers(headersInit);
  timer.apply(headers);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: result.error.code === "BAD_REQUEST" ? 400 : 500,
      headers,
    });
  }
  return new Response(JSON.stringify(result.value), { status: 200, headers });
}

async function runOcr(payload: OcrRequest & { mode: "fast" | "accurate" }, logger: ReturnType<typeof createLogger>, req: Request) {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    await logger.error('OpenAI API key not configured', {
      code: 'MISSING_API_KEY',
      details: { env: Deno.env.get('ENV') || 'staging' },
      ...extractRequestContext(req),
    });
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
    await logger.error('OpenAI API error', {
      code: response.status === 429 ? 'OPENAI_RATE_LIMIT' :
            response.status === 402 ? 'OPENAI_CREDITS_DEPLETED' :
            'OPENAI_API_ERROR',
      details: {
        status: response.status,
        statusText: response.statusText,
        errorText: details.substring(0, 500),
        model,
        mode: payload.mode,
      },
      ...extractRequestContext(req),
    });
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
