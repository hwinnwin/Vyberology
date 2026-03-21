// ============================================================
// Lumyn Intelligence Layer — 8-Step Orchestrator (§4)
// ============================================================

import OpenAI from 'npm:openai'
import { z } from 'npm:zod'
import { SupabaseClient } from 'npm:@supabase/supabase-js'

import {
  getOrCreateConversation,
  getOrCreateUserModel,
  getSessionHistory,
  getClaims,
  getRecentPatterns,
  getGuidingPrinciples,
  getMemorableMoments,
  insertMessage,
  logSafetyEvent,
  logMemoryOps,
  upsertRateLimit,
  closeStaleConversations,
  upsertClaim,
  deprecateClaim,
  getUserEntitlement,
  resolveLumynEntitlement,
} from './db.ts'

import {
  scanForCrisis,
  detectOverreach,
  ANCHOR_SAFE_RESPONSE,
  CRISIS_RESOURCES,
} from './safety.ts'

import { assemblePrompt } from './prompt.ts'
import { processMemorableMoments, generateConversationSummary } from './memory.ts'

import type {
  LumynMode,
  LumynInput,
  ChatResponse,
  ContextBundle,
  InsertMemoryOpData,
} from './types.ts'

// ─────────────────────────────────────────────
// Zod schema for LLM JSON output (§4.1)
// ─────────────────────────────────────────────

const LLMResponseSchema = z.object({
  response: z.string().min(1),
  classification: z.object({
    intent: z.enum(['vent', 'decide', 'plan', 'crisis', 'explore', 'curiosity']),
    emotion: z.string(),
    domain: z.enum([
      'numerology',
      'career',
      'relationships',
      'identity',
      'health',
      'money',
      'existential',
      'general',
    ]),
    risk_level: z.enum(['none', 'low', 'medium', 'high', 'crisis']),
    confidence: z.number().min(0).max(1),
  }),
  memory_suggestions: z
    .array(
      z.object({
        op: z.enum(['create', 'update', 'deprecate']),
        type: z.string(),
        key: z.string(),
        data: z.record(z.unknown()),
        confidence: z.number(),
        reason: z.string(),
      })
    )
    .default([]),
  memorable_moments: z
    .array(
      z.object({
        quote: z.string(),
        moment_type: z.enum([
          'decision',
          'revelation',
          'emotion',
          'commitment',
          'boundary',
        ]),
        selection_confidence: z.number(),
      })
    )
    .default([]),
})

// ─────────────────────────────────────────────
// Safe fallback response
// ─────────────────────────────────────────────

const SAFE_FALLBACK =
  "I'm here with you. Could you tell me a bit more about what's on your mind?"

const RATE_LIMIT_MESSAGE =
  "I'm taking a moment to rest — come back in a little while."

// ─────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────

export async function runOrchestrator(params: {
  supabase: SupabaseClient
  userId: string
  message: string
  conversationId?: string
  mode?: LumynMode
  vyberologyContext: LumynInput[]
}): Promise<ChatResponse> {
  const { supabase, userId, message } = params

  // ── Entitlement check ─────────────────────────────────────
  const entitlement = await getUserEntitlement(supabase, userId)
  const isPro = resolveLumynEntitlement(entitlement)

  if (!isPro) {
    // Atomic free-message increment — returns null if limit hit
    const { data: newCount, error: rpcError } = await supabase.rpc('lumyn_increment_free_messages', {
      p_user_id: userId,
    })

    if (rpcError) {
      // Fail open on transient DB error — don't block user with paywall
      console.error('lumyn_increment_free_messages RPC error:', rpcError.message)
    } else if (newCount === null) {
      // Paywall hit — log event and return paywall response
      await logSafetyEvent(supabase, {
        user_id: userId,
        event_type: 'paywall_hit',
        trigger_source: 'policy',
        details: {
          messages_used: entitlement.lumyn_messages_used,
          mode_requested: params.mode ?? 'reflect',
        },
      })

      return {
        conversationId: params.conversationId ?? 'no-conversation',
        message: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
        },
        mode: 'reflect',
        classification: { intent: 'explore', emotion: 'neutral', domain: 'general' },
        client_directives: { crisis_banner: false, anchor_active: false },
        paywall: true,
      }
    }
  }

  // ── Mode coercion (declared AFTER isPro is available) ──────
  const mode: LumynMode = !isPro ? 'reflect' : (params.mode ?? 'reflect')

  // ── Strip context for free users ───────────────────────────
  const vyberologyContext = isPro
    ? params.vyberologyContext
    : params.vyberologyContext
        ? params.vyberologyContext.filter(
            (i: { label: string }) => i.label !== 'ReadingHistory' && i.label !== 'UserProfile'
          )
        : []

  // ── Step 1: Rate limit check ──────────────────────────────
  const rateLimits = await upsertRateLimit(supabase, userId)
  if (rateLimits.count_hour > 60 || rateLimits.count_day > 500) {
    return buildFallbackResponse(RATE_LIMIT_MESSAGE, mode, 'no-conversation')
  }

  // ── Step 2: Load context bundle ───────────────────────────
  const conversation = await getOrCreateConversation(
    supabase,
    userId,
    params.conversationId,
    mode
  )
  const conversationId = conversation.id

  const [userModel, claims, patterns, principles, memorableMoments] =
    await Promise.all([
      getOrCreateUserModel(supabase, userId),
      getClaims(supabase, userId),
      getRecentPatterns(supabase, userId, 5),
      getGuidingPrinciples(supabase, userId),
      getMemorableMoments(supabase, userId, 4),
    ])

  const sessionHistory = await getSessionHistory(supabase, conversationId, 50)

  const bundle: ContextBundle = {
    conversation,
    userModel,
    sessionHistory,
    claims,
    patterns,
    principles,
    memorableMoments,
  }

  // ── Step 3: Insert user message ───────────────────────────
  const userMsg = await insertMessage(supabase, {
    conversation_id: conversationId,
    user_id: userId,
    role: 'user',
    content: message,
  })

  // ── Step 4: Pre-LLM policy check ─────────────────────────
  const crisisResult = scanForCrisis(message)
  let tier2Crisis = false

  if (crisisResult.detected) {
    if (crisisResult.tier === 1) {
      // Hard crisis: short-circuit, return anchor response immediately
      await logSafetyEvent(supabase, {
        user_id: userId,
        event_type: 'crisis_detected',
        trigger_source: 'keyword',
        details: { matched_phrase: crisisResult.matchedPhrase },
        message_id: userMsg.id,
      })

      const content = ANCHOR_SAFE_RESPONSE + CRISIS_RESOURCES
      const assistantMsg = await insertMessage(supabase, {
        conversation_id: conversationId,
        user_id: userId,
        role: 'assistant',
        content,
        risk_level: 'crisis',
        prompt_version: '1.0',
        model_provider: 'system',
        model_name: 'safety-gate',
      })

      return {
        conversationId,
        message: {
          id: assistantMsg.id,
          role: 'assistant',
          content,
          created_at: assistantMsg.created_at,
        },
        mode: 'anchor',
        classification: {
          intent: 'crisis',
          emotion: 'distress',
          domain: 'general',
        },
        client_directives: {
          crisis_banner: true,
          anchor_active: true,
        },
      }
    } else if (crisisResult.tier === 2) {
      // Soft crisis: log and continue, append resources at Step 8
      tier2Crisis = true
      await logSafetyEvent(supabase, {
        user_id: userId,
        event_type: 'escalation',
        trigger_source: 'keyword',
        details: { matched_phrase: crisisResult.matchedPhrase },
        message_id: userMsg.id,
      })
    }
  }

  // ── Step 5: Prompt assembly ───────────────────────────────
  // Add the current user message as the final [9] block
  const promptMessages = assemblePrompt(bundle, vyberologyContext)
  promptMessages.push({ role: 'user', content: message })

  // ── Step 6: LLM call ──────────────────────────────────────
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return buildFallbackResponse(SAFE_FALLBACK, mode, conversationId)
  }

  const client = new OpenAI({ apiKey })

  const t0 = Date.now()
  let rawCompletion: Awaited<ReturnType<typeof client.chat.completions.create>>

  try {
    rawCompletion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: promptMessages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2048,
    })
  } catch (err) {
    console.error('OpenAI error:', err)
    return buildFallbackResponse(SAFE_FALLBACK, mode, conversationId)
  }

  const latencyMs = Date.now() - t0
  const tokensIn = rawCompletion.usage?.prompt_tokens ?? 0
  const tokensOut = rawCompletion.usage?.completion_tokens ?? 0
  const rawContent = rawCompletion.choices[0]?.message?.content ?? ''

  // ── Step 7: Post-LLM validation ───────────────────────────
  let llmData: z.infer<typeof LLMResponseSchema>
  try {
    llmData = LLMResponseSchema.parse(JSON.parse(rawContent))
  } catch (zodErr) {
    console.error('Zod parse failure:', zodErr, 'raw:', rawContent.slice(0, 500))
    return buildFallbackResponse(SAFE_FALLBACK, mode, conversationId)
  }

  // Overreach detection
  const overreach = detectOverreach(llmData.response)
  if (overreach.shouldDiscard) {
    await logSafetyEvent(supabase, {
      user_id: userId,
      event_type: 'overreach_blocked',
      trigger_source: 'policy',
      details: { flags: overreach.flags },
      message_id: userMsg.id,
    })
    return buildFallbackResponse(SAFE_FALLBACK, mode, conversationId)
  }

  // Mode compliance: crisis risk_level → force anchor
  let effectiveMode = mode
  let anchorActive = false
  if (llmData.classification.risk_level === 'crisis' && mode !== 'anchor') {
    effectiveMode = 'anchor'
    anchorActive = true
  }

  // ── Step 8: Memory write + respond ────────────────────────
  // Append tier 2 crisis resources if applicable
  let responseContent = llmData.response
  if (tier2Crisis) {
    responseContent += CRISIS_RESOURCES
  }

  // Insert assistant message with all observability columns
  const classification = llmData.classification
  const assistantMsg = await insertMessage(supabase, {
    conversation_id: conversationId,
    user_id: userId,
    role: 'assistant',
    content: responseContent,
    intent: classification.intent,
    emotion: classification.emotion,
    domain: classification.domain,
    risk_level: classification.risk_level,
    confidence: classification.confidence,
    classification: llmData,
    prompt_version: '1.0',
    model_provider: 'openai',
    model_name: 'gpt-4o',
    latency_ms: latencyMs,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  })

  // Memory writes — Pro only
  if (isPro) {
    // Process memorable moments
    await processMemorableMoments(
      userId,
      conversationId,
      llmData.memorable_moments,
      [...sessionHistory, userMsg, assistantMsg],
      supabase
    )

    // Process memory suggestions → upsert/deprecate claims + log ops
    const memoryOps: InsertMemoryOpData[] = []
    for (const suggestion of llmData.memory_suggestions) {
      try {
        if (suggestion.op === 'create' || suggestion.op === 'update') {
          const claim = await upsertClaim(supabase, userId, {
            type: suggestion.type as never,
            key: suggestion.key,
            data: suggestion.data,
            confidence: suggestion.confidence,
            source_conversation_id: conversationId,
          })
          memoryOps.push({
            user_id: userId,
            message_id: assistantMsg.id,
            op_type: suggestion.op,
            target_claim_id: claim.id,
            target_desc: suggestion.key,
            reason: suggestion.reason,
          })
        } else if (suggestion.op === 'deprecate') {
          // Find claim by key and deprecate
          const existing = claims.find((c) => c.key === suggestion.key)
          if (existing) {
            await deprecateClaim(supabase, existing.id)
            memoryOps.push({
              user_id: userId,
              message_id: assistantMsg.id,
              op_type: 'deprecate',
              target_claim_id: existing.id,
              target_desc: suggestion.key,
              reason: suggestion.reason,
            })
          }
        }
      } catch {
        // Don't fail the response on memory write errors
      }
    }

    if (memoryOps.length > 0) {
      await logMemoryOps(supabase, memoryOps)
    }
  }

  // Close stale conversations async (non-blocking)
  closeStaleConversations(supabase, userId).catch(() => {})

  // Also trigger summary generation if conversation is being closed
  if (conversation.status === 'closed' && isPro) {
    generateConversationSummary(conversationId, supabase).catch(() => {})
  }

  return {
    conversationId,
    message: {
      id: assistantMsg.id,
      role: 'assistant',
      content: responseContent,
      created_at: assistantMsg.created_at,
    },
    mode: effectiveMode,
    classification: {
      intent: classification.intent,
      emotion: classification.emotion,
      domain: classification.domain,
    },
    client_directives: {
      crisis_banner: tier2Crisis ? false : anchorActive,
      anchor_active: anchorActive,
    },
  }
}

// ─────────────────────────────────────────────
// Helper: build a safe fallback ChatResponse
// ─────────────────────────────────────────────

function buildFallbackResponse(
  content: string,
  mode: LumynMode,
  conversationId: string
): ChatResponse {
  return {
    conversationId,
    message: {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      created_at: new Date().toISOString(),
    },
    mode,
    classification: {
      intent: 'explore',
      emotion: 'neutral',
      domain: 'general',
    },
    client_directives: {
      crisis_banner: false,
      anchor_active: false,
    },
  }
}
