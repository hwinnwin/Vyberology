import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCors, passesRateLimit } from "../_shared/security.ts";
import { ServerTimer } from "../_lib/serverTiming.ts";
import { prepareCompareResult } from "./handler.ts";

serve(async (req) => {
  const timer = new ServerTimer();
  const { headers, allowed } = buildCors(req.headers.get("origin"));
  const jsonHeaders = { ...headers, "Content-Type": "application/json" };

  const responseWith = (body: string, status: number) => {
    const headersObj = new Headers(jsonHeaders);
    timer.apply(headersObj);
    return new Response(body, { status, headers: headersObj });
  };

  if (req.method === "OPTIONS") {
    return responseWith("", 204);
  }

  if (!allowed) {
    return responseWith(JSON.stringify({ error: "Origin not allowed" }), 403);
  }

  const rateSpan = timer.start("db");
  const withinLimit = await passesRateLimit(req, "compare");
  timer.end(rateSpan);

  if (!withinLimit) {
    return responseWith(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), 429);
  }

  let payload: unknown;
  try {
    const parseSpan = timer.start("parse");
    payload = await req.json();
    timer.end(parseSpan);
  } catch {
    return responseWith(JSON.stringify({ error: "Invalid JSON payload" }), 400);
  }

  const renderSpan = timer.start("render");
  const result = prepareCompareResult(payload);
  timer.end(renderSpan);

  if (!result.ok) {
    return responseWith(JSON.stringify({ error: result.error.message }), 400);
  }

  return responseWith(JSON.stringify(result.value), 200);
});
