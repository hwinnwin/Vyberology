import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCors, passesRateLimit } from "../_shared/security.ts";
import { ServerTimer } from "../_lib/serverTiming.ts";
import { createLogger, extractRequestContext } from "../_shared/errorLogger.ts";

const LUMEN_TONE = `You are Lumen. Style: simple, warm, direct. Intelligently detect input type (time/repeating numbers/date) and omit sections without data.

🌍 Vyberology (if time/date): [time] Seal, Theme
🕰️ Anchor Frame (if multiple data): show data OR just core number
🔢 Number Breakdown: table with calc work, Core Frequency
💠 Simple Reading: 2-3 paras
[Dynamic emoji] Energy Message: 1 quote - choose emoji based on energy type (🌿 growth, 🔥 transformation, 💧 flow, ⚡ power, ✨ magic, 🌊 change, 🌸 bloom, etc.)
🜂 Alignment Summary: table
✨ Chakra + Element: elements, chakras, brief guidance
🧭 Guidance: area + 2 sentences
✴️ Essence: 1 closing quote

Rules: Keep 11/22/33, use ⸻ dividers, omit empty sections, match emoji to energy vibe`;

const GOLD_SHOT = `
🌍 Vyberology
09:55 → 10:01 Seal
Theme: Receiving & Flow

⸻

🕰️ Anchor Frame
09:55 → 10:01 | 75–76% | 16 °C · 15 °C · 19 °C

⸻

🔢 Number Breakdown

| Number | Reduced or Master | Meaning |
|--------|------------------|---------|
| 955 | 1 | New beginning |
| 1001 | 11 | Master Intuition |
| 75–76 | 3 / 4 | Communication → stability |

Core Frequency: 1 · 11 · 3 · 4 → 8 = Flow & Abundance

⸻

💠 Simple Reading

Double 11 frames completion and new start. What you feel, you attract. Balance energy and money.

⸻

🌿 Energy Message

"Relax — good things flow when you stay calm and ready."

⸻

🜂 Alignment Summary

| Focus | Number | Meaning | What To Do |
|-------|--------|---------|------------|
| New Start | 1 | Begin fresh | Clear headspace |
| Intuition | 11 | Trust signal | Say yes to what feels right |
| Abundance | 8 | Flow | Accept opportunities |

⸻

✨ Chakra + Element Resonance

Water + Air. Heart & Solar Plexus — receive through openness, act with confidence.

⸻

🧭 Guidance Aspect

Area: Energy & Abundance
Relax into what's here. Next steps feel natural when you stay light.

⸻

✴️ Essence Sentence

"Good things reach you when you stay calm and ready."
`.trim();

type DepthMode = "lite" | "standard" | "deep";
type InputField = { label: string; value: string | number };
type VybeReadingRequest = { inputs: InputField[]; depth?: DepthMode };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isInputField = (value: unknown): value is InputField =>
  isRecord(value) &&
  typeof value.label === 'string' &&
  (typeof value.value === 'string' || typeof value.value === 'number');

const isVybeReadingRequest = (value: unknown): value is VybeReadingRequest =>
  isRecord(value) &&
  Array.isArray(value.inputs) &&
  value.inputs.every(isInputField) &&
  (value.depth === undefined || value.depth === 'lite' || value.depth === 'standard' || value.depth === 'deep');

serve(async (req) => {
  const timer = new ServerTimer();
  const requestId = crypto.randomUUID();
  const environment = (Deno.env.get('ENV') || 'staging') as 'staging' | 'production';

  // Initialize error logger for this request
  const logger = createLogger(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    {
      environment,
      service: 'edge:function:vybe-reading',
      requestId,
    }
  );

  const { headers, allowed } = buildCors(req.headers.get('origin'));
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };
  const respond = (payload: unknown, status: number) => {
    const headersObj = new Headers(jsonHeaders);
    timer.apply(headersObj);
    return new Response(JSON.stringify(payload), { status, headers: headersObj });
  };

  if (req.method === 'OPTIONS') {
    return respond("", 204);
  }

  if (!allowed) {
    return respond({ error: 'Origin not allowed' }, 403);
  }

  const rateSpan = timer.start("db");
  const withinLimit = await passesRateLimit(req, 'vybe-reading');
  timer.end(rateSpan);

  if (!withinLimit) {
    return respond({ error: 'Rate limit exceeded. Please try again shortly.' }, 429);
  }

  try {
    const parseSpan = timer.start("parse");
    const payload = await req.json();
    timer.end(parseSpan);
    if (!isVybeReadingRequest(payload) || payload.inputs.length === 0) {
      return respond({ error: 'inputs array is required' }, 400);
    }

    const { inputs, depth = "standard" } = payload;

    console.log('Vybe reading request:', { inputs, depth });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
   if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      await logger.error('OpenAI API key not configured', {
        code: 'MISSING_API_KEY',
        details: { env: environment },
        ...extractRequestContext(req),
      });
      return respond({ error: 'API key not configured' }, 500);
    }

    const lengthHint =
      depth === "lite" ? "~200–300 words." :
      depth === "deep" ? "~800–1200 words." :
      "~400–600 words.";

    const model = "gpt-4o-mini";
    const maxTokens = depth === "deep" ? 1500 : depth === "lite" ? 400 : 800;

    const userPrompt = `Reading for: ${inputs.map((input) => `${input.label}: ${input.value}`).join(", ")}
Output: sectioned format, adapt to input, show calc work, keep 11/22/33, ${lengthHint}`.trim();

    console.log('Calling OpenAI with model:', model);

    const openaiSpan = timer.start("openai");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: LUMEN_TONE },
          { role: 'assistant', content: GOLD_SHOT },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      timer.end(openaiSpan);
      const errorText = await response.text();

      await logger.error('OpenAI API error', {
        code: response.status === 429 ? 'OPENAI_RATE_LIMIT' :
              response.status === 402 ? 'OPENAI_CREDITS_DEPLETED' :
              'OPENAI_API_ERROR',
        details: {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500), // Limit size
          model,
          depth,
        },
        ...extractRequestContext(req),
      });

      if (response.status === 429) {
        return respond({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      }
      if (response.status === 402) {
        return respond({ error: "AI credits depleted. Please add credits to continue." }, 402);
      }
      console.error('OpenAI error:', response.status, errorText);
      return respond({ error: `AI service error: ${response.status}` }, 500);
    }

    const data = await response.json();
    timer.end(openaiSpan);
    const reading = data.choices?.[0]?.message?.content?.trim() || 'No output.';
    
    console.log('Generated reading length:', reading.length);

    return respond({ reading }, 200);

  } catch (error) {
    console.error('Error in vybe-reading function:', error);

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

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return respond({ error: errorMessage }, 500);
  }
});
