/**
 * Direct fetch() wrapper for the vybe-reading edge function.
 * Bypasses supabase.functions.invoke() to properly handle SSE streams.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

function parseSSEText(raw: string): string {
  let reading = "";
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) continue;
    const payload = trimmed.slice(6);
    if (payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload);
      if (parsed.content) {
        reading += parsed.content;
      }
    } catch {
      // skip unparseable chunks
    }
  }
  return reading;
}

export async function callVybeReading(
  inputs: Array<{ label: string; value: string }>,
  depth: string = "standard",
  mode: string = "capture"
): Promise<string> {
  const url = `${supabaseUrl}/functions/v1/vybe-reading`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
    },
    body: JSON.stringify({ inputs, depth, mode, lang: localStorage.getItem("vyberology_language") || "en" }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Edge function error (${res.status}): ${errText}`);
  }

  const contentType = res.headers.get("content-type") || "";

  // SSE stream response (OpenAI key is set)
  if (contentType.includes("text/event-stream")) {
    const raw = await res.text();
    const reading = parseSSEText(raw);
    if (!reading) {
      throw new Error("No reading content in SSE stream");
    }
    return reading;
  }

  // JSON fallback response (no OpenAI key)
  if (contentType.includes("application/json")) {
    const json = await res.json();
    if (json.reading) {
      return json.reading;
    }
    throw new Error("No reading field in JSON response");
  }

  // Plain text fallback
  const text = await res.text();
  if (text) return text;

  throw new Error("No reading data received");
}
