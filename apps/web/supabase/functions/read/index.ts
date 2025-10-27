import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCors, passesRateLimit } from "../_shared/security.ts";
import { ServerTimer } from "../_lib/serverTiming.ts";
import { prepareReadResult } from "./handler.ts";
import { createLogger, extractRequestContext } from "../_shared/errorLogger.ts";

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const environment = (Deno.env.get('ENV') || 'staging') as 'staging' | 'production';

  const logger = createLogger(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { environment, service: 'edge:function:read', requestId }
  );

  const timer = new ServerTimer();
  const { headers, allowed } = buildCors(req.headers.get("origin"));
  const jsonHeaders = { ...headers, "Content-Type": "application/json" };

  const respond = (body: string, status: number) => {
    const headersObj = new Headers(jsonHeaders);
    timer.apply(headersObj);
    return new Response(body, { status, headers: headersObj });
  };

  if (req.method === "OPTIONS") {
    return respond("", 204);
  }

  if (!allowed) {
    await logger.warn('CORS origin not allowed', {
      code: 'CORS_ORIGIN_NOT_ALLOWED',
      details: { origin: req.headers.get("origin") },
      ...extractRequestContext(req),
    });
    return respond(JSON.stringify({ error: "Origin not allowed" }), 403);
  }

  const rateSpan = timer.start("db");
  const withinLimit = await passesRateLimit(req, "read");
  timer.end(rateSpan);

  if (!withinLimit) {
    await logger.warn('Rate limit exceeded', {
      code: 'RATE_LIMIT_EXCEEDED',
      details: { endpoint: 'read' },
      ...extractRequestContext(req),
    });
    return respond(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), 429);
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
    return respond(JSON.stringify({ error: "Invalid JSON payload" }), 400);
  }

  try {
    const renderSpan = timer.start("render");
    const result = prepareReadResult(payload);
    timer.end(renderSpan);

    if (!result.ok) {
      await logger.warn('Read result validation failed', {
        code: 'VALIDATION_ERROR',
        details: { error: result.error.message },
        ...extractRequestContext(req),
      });
      return respond(JSON.stringify({ error: result.error.message }), 400);
    }

    return respond(JSON.stringify(result.value), 200);
  } catch (error) {
    await logger.error(
      error instanceof Error ? error.message : 'Unknown error occurred',
      {
        code: 'UNHANDLED_ERROR',
        details: {
          errorType: typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        },
        ...extractRequestContext(req),
      }
    );
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return respond(JSON.stringify({ error: message }), 500);
  }
});
