// ============================================================
// Lumyn TTS — Text-to-Speech via OpenAI
// Proxies OpenAI TTS API, returns audio/mpeg stream
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Max chars to synthesise per request (keeps latency + cost low)
const MAX_CHARS = 1000

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405)
  }

  // Auth check
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonError('Unauthorized', 401)
  }
  const jwt = authHeader.slice(7)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return jsonError('Unauthorized', 401)
  }

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('Invalid JSON body', 400)
  }

  const { text } = body as { text?: string }
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return jsonError('Field "text" is required', 400)
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return jsonError('TTS not configured', 500)
  }

  // Truncate to keep latency and cost predictable
  const input = text.trim().slice(0, MAX_CHARS)

  try {
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input,
        voice: 'nova',  // warm, clear female voice — suits Lumyn's character
        response_format: 'mp3',
        speed: 0.95,    // slightly slower for a calm, present tone
      }),
    })

    if (!ttsResponse.ok) {
      const err = await ttsResponse.text()
      console.error('[lumyn-tts] OpenAI error:', err)
      return jsonError('TTS generation failed', 502)
    }

    // Stream the audio back to the client
    return new Response(ttsResponse.body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[lumyn-tts] Error:', err)
    return jsonError('Internal error', 500)
  }
})

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
