import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; // added by Lumen (Stage 4A compare typing)
import { buildCors, passesRateLimit } from "../_shared/security.ts"; // added by Lumen (Stage 4A compare typing)
import { prepareCompareResult } from "./handler.ts"; // added by Lumen (Stage 4A compare typing)

serve(async (req) => { // added by Lumen (Stage 4A compare typing)
  const { headers, allowed } = buildCors(req.headers.get("origin"));
  const jsonHeaders = { ...headers, "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (!allowed) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  if (!(await passesRateLimit(req, "compare"))) {
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

  const result = prepareCompareResult(payload);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify(result.value), {
    status: 200,
    headers: jsonHeaders,
  });
});
