import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCors, passesRateLimit } from "../_shared/security.ts";

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

serve(async (req) => {
  const { headers, allowed } = buildCors(req.headers.get('origin'));
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  if (!(await passesRateLimit(req, 'vybe-reading'))) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
      status: 429,
      headers: jsonHeaders,
    });
  }

  try {
    const { inputs, depth = "standard" } = await req.json();
    
    console.log('Vybe reading request:', { inputs, depth });

    if (!inputs || inputs.length === 0) {
      return new Response(JSON.stringify({ error: 'inputs array is required' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const lengthHint =
      depth === "lite" ? "~150–200 words." :
      depth === "deep" ? "~600–800 words." :
      "~300–400 words.";

    const model = "gpt-4o-mini";
    const maxTokens = depth === "deep" ? 900 : depth === "lite" ? 300 : 500;

    const userPrompt = `Reading for: ${inputs.map((i: any) => `${i.label}: ${i.value}`).join(", ")}
Output: sectioned format, adapt to input, show calc work, keep 11/22/33, ${lengthHint}`.trim();

    console.log('Calling OpenAI with model:', model);

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: jsonHeaders,
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: jsonHeaders,
        });
      }
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `AI service error: ${response.status}` }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const data = await response.json();
    const reading = data.choices?.[0]?.message?.content?.trim() || 'No output.';
    
    console.log('Generated reading length:', reading.length);

    return new Response(JSON.stringify({ reading }), {
      status: 200,
      headers: jsonHeaders,
    });

  } catch (error) {
    console.error('Error in vybe-reading function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
