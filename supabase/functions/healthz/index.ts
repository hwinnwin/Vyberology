import { securityHeaders } from "../../apps/web/supabase/functions/_lib/securityHeaders.ts";

const HEADERS: HeadersInit = {
  ...securityHeaders,
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
};

async function depsOk(): Promise<boolean> {
  return true;
}

Deno.serve(async () => {
  const ready = await depsOk();
  const body = {
    name: "Vyberology",
    ready,
    version: Deno.env.get("VYBE_VERSION") ?? "dev",
    git: Deno.env.get("VYBE_GIT_SHA") ?? "unknown",
    time: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status: ready ? 200 : 503,
    headers: HEADERS,
  });
});
