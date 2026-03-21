// ============================================================
// Lumyn Intelligence Layer — Edge Function Entry Point (§3.3)
// Auth, request parsing, orchestrator dispatch, SSE streaming
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js'
import { runOrchestrator } from './orchestrator.ts'
import type { LumynMode, LumynInput } from './types.ts'

// ─────────────────────────────────────────────
// CORS headers
// ─────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─────────────────────────────────────────────
// SSE helper
// ─────────────────────────────────────────────

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

// ─────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405)
  }

  // ── Auth: verify JWT ───────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonError('Missing or invalid Authorization header', 401)
  }
  const jwt = authHeader.slice(7)

  // Create a user-scoped client to verify the JWT
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser()

  if (authError || !user) {
    return jsonError('Unauthorized', 401)
  }

  // ── Parse request body ─────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('Invalid JSON body', 400)
  }

  const { message, conversationId, mode, vyberologyContext } = body as {
    message?: string
    conversationId?: string
    mode?: LumynMode
    vyberologyContext?: LumynInput[]
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return jsonError('Field "message" is required', 400)
  }

  // ── Create service-role client for orchestrator ───────────
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // ── Set up SSE stream ──────────────────────────────────────
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  const sseResponse = new Response(readable, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })

  // Run orchestrator async, don't await before returning response
  runOrchestrator({
    supabase,
    userId: user.id,
    message: message.trim(),
    conversationId,
    mode: isValidMode(mode) ? mode : 'reflect',
    vyberologyContext: Array.isArray(vyberologyContext) ? vyberologyContext : [],
    onToken: (token) => {
      writer.write(encoder.encode(sseEvent({ type: 'token', content: token })))
    },
    onDone: (result) => {
      writer.write(encoder.encode(sseEvent({ type: 'done', ...result })))
      writer.close()
    },
    onError: (error) => {
      writer.write(encoder.encode(sseEvent({ type: 'error', error: error.message })))
      writer.close()
    },
  }).catch((err) => {
    console.error('[lumyn-chat] Orchestrator error:', err)
    writer.write(encoder.encode(sseEvent({ type: 'error', error: 'Internal error' })))
    writer.close()
  })

  return sseResponse
})

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

const VALID_MODES: LumynMode[] = ['reflect', 'illuminate', 'anchor', 'silent']
function isValidMode(value: unknown): value is LumynMode {
  return typeof value === 'string' && (VALID_MODES as string[]).includes(value)
}
