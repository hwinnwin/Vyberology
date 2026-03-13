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

Rules: use ⸻ dividers, omit empty sections, match emoji to energy vibe.
MASTER NUMBER RULES (STRICT):
- A master number (11/22/33) ONLY counts when it is the FINAL digit-sum of ALL digits in a complete input.
- For clock times like "14:33": reduce ALL digits together (1+4+3+3=11). If that sum is 11/22/33, it IS master. But do NOT treat sub-components (e.g., the "33" minutes) as a separate master number — reduce sub-components fully to single digits.
- NEVER fabricate mirrored patterns (e.g., "33:33", "11:11") unless the exact pattern appears in the observed input. A single "14:33" does NOT justify "33:33".
- Each Number Breakdown row must correspond to an actually captured value or a clearly labeled sub-component (hour, minute), never an invented pattern.`;

const GOLD_SHOT = `
🌍 Vyberology
14:33 Seal
Theme: Quiet Momentum — Grounding Before the Leap

⸻

🔢 Number Breakdown

| Number | Reduced or Master | Meaning |
|--------|------------------|---------|
| 14:33 (full time) | 1 + 4 + 3 + 3 = 11 → Master Intuition | The complete time reduces to a master number — trust the signal |
| 14 (hour) | 1 + 4 = 5 | Change, freedom, adaptability |
| 33 (minute) | 3 + 3 = 6 | Harmony, responsibility, nurturing |

Main Frequency: 11 (Master) · 5 · 6
Core Theme: 11 = Intuitive Alignment

⸻

💠 Simple Reading

You caught this time because something in you is already listening. The full reduction to 11 is real — all four digits combine to a master frequency. The hour carries 5 energy: change is in motion. The minute brings 6: home, care, the people close to you. The 11 holding it all says trust the instinct.

⸻

🌿 Energy Message

"When your body tells you to look, your soul already knows what it sees."

⸻

🜂 Alignment Summary

| Focus | Number | Meaning | What To Do |
|-------|--------|---------|------------|
| Intuition | 11 | Master signal | Act on the first clear impulse today |
| Change | 5 | Movement | Say yes to what you've been sitting on |
| Harmony | 6 | Care, balance | Check in on someone you love |

⸻

✨ Chakra + Element Resonance

Air (11's clarity) + Earth (6's grounding). Third Eye and Heart — see clearly, land softly.

⸻

🧭 Guidance Aspect

Area: Trust & Transition
Listen, notice, and respond to what shows up. The 11 says the signal is clear. The 5 says movement is coming. The 6 says it's taking you somewhere good.

⸻

✴️ Essence Sentence

"The clock didn't just show you a time — it showed you a frequency."
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

// Simple cache for common time readings (11:11, 22:22, etc.)
const readingCache = new Map<string, { reading: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

function getCacheKey(inputs: InputField[], depth: DepthMode): string {
  return JSON.stringify({ inputs, depth });
}

function getCachedReading(key: string): string | null {
  const cached = readingCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    readingCache.delete(key);
    return null;
  }
  return cached.reading;
}

function cacheReading(key: string, reading: string): void {
  readingCache.set(key, { reading, timestamp: Date.now() });
  // Keep cache size reasonable
  if (readingCache.size > 100) {
    const firstKey = readingCache.keys().next().value;
    readingCache.delete(firstKey);
  }
}

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
    const headersObj = new Headers(jsonHeaders);
    timer.apply(headersObj);
    return new Response(null, { status: 204, headers: headersObj });
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

    // Check cache for common readings
    const cacheKey = getCacheKey(inputs, depth);
    const cachedReading = getCachedReading(cacheKey);
    if (cachedReading) {
      console.log('Cache hit for:', cacheKey);
      return respond({ reading: cachedReading, cached: true }, 200);
    }

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
Output: sectioned format, adapt to input, show calc work. MASTER NUMBER DISCIPLINE: Only mark a number as Master (11/22/33) when the FINAL digit-sum of ALL digits in a complete input equals 11, 22, or 33. Sub-components reduce to single digits. Never fabricate mirrored patterns not present in the input. ${lengthHint}`.trim();

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
        stream: true,
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

    timer.end(openaiSpan);

    // Stream the response back to the client
    const headers = new Headers(jsonHeaders);
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');
    timer.apply(headers);

    // Create a readable stream that forwards OpenAI's stream and caches the result
    let fullReading = '';
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

            for (const line of lines) {
              const data = line.replace(/^data: /, '');
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullReading += content;
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                // Skip invalid JSON chunks
              }
            }
          }
        } finally {
          // Cache the complete reading
          if (fullReading) {
            cacheReading(cacheKey, fullReading);
            console.log('Cached reading for:', cacheKey, 'length:', fullReading.length);
          }
          controller.close();
        }
      }
    });

    return new Response(stream, { status: 200, headers });

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
