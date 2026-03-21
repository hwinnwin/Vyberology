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
// Zod schema for classification-only LLM output (Phase 2)
// ─────────────────────────────────────────────

const ClassificationSchema = z.object({
  classification: z.object({
    intent: z.enum(['vent', 'decide', 'plan', 'crisis', 'explore', 'curiosity']).catch('explore'),
    emotion: z.string().catch('neutral'),
    domain: z.enum([
      'numerology',
      'career',
      'relationships',
      'identity',
      'health',
      'money',
      'existential',
      'general',
    ]).catch('general'),
    risk_level: z.enum(['none', 'low', 'medium', 'high', 'crisis']).catch('none'),
    confidence: z.number().min(0).max(1).catch(0.8),
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

// Keep the original full schema for reference
const LLMResponseSchema = z.object({
  response: z.string().min(1),
  classification: z.object({
    intent: z.enum(['vent', 'decide', 'plan', 'crisis', 'explore', 'curiosity']).catch('explore'),
    emotion: z.string().catch('neutral'),
    domain: z.enum([
      'numerology',
      'career',
      'relationships',
      'identity',
      'health',
      'money',
      'existential',
      'general',
    ]).catch('general'),
    risk_level: z.enum(['none', 'low', 'medium', 'high', 'crisis']).catch('none'),
    confidence: z.number().min(0).max(1).catch(0.8),
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
// Main orchestrator (streaming)
// ─────────────────────────────────────────────

export async function runOrchestrator(params: {
  supabase: SupabaseClient
  userId: string
  message: string
  conversationId?: string
  mode?: LumynMode
  vyberologyContext: LumynInput[]
  onToken: (token: string) => void
  onDone: (result: ChatResponse & { title?: string }) => void
  onError: (error: Error) => void
}): Promise<void> {
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
      // Paywall hit — log event and call onDone with paywall response
      await logSafetyEvent(supabase, {
        user_id: userId,
        event_type: 'paywall_hit',
        trigger_source: 'policy',
        details: {
          messages_used: entitlement.lumyn_messages_used,
          mode_requested: params.mode ?? 'reflect',
        },
      })

      params.onDone({
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
      })
      return
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
    params.onError(new Error(RATE_LIMIT_MESSAGE))
    return
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
      // Hard crisis: short-circuit, call onDone with anchor response immediately
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

      params.onDone({
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
      })
      return
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

  // ── Step 6: LLM call (Phase 1 — streaming response text) ─
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    params.onError(new Error(SAFE_FALLBACK))
    return
  }

  const client = new OpenAI({ apiKey })

  // For Phase 1 streaming, strip the JSON output instruction from the system prompt
  // so the model responds with natural prose only (not a JSON wrapper)
  const streamingMessages = promptMessages.map((m) =>
    m.role === 'system'
      ? {
          ...m,
          content: m.content
            .replace(/You must respond with valid JSON only\.[^\n]*/g, 'Respond with your message in natural prose only. Do not output JSON or any structured format.')
            .replace(/No markdown outside the JSON\.[^\n]*/g, '')
            .replace(/No preamble\. No trailing text\.[^\n]*/g, ''),
        }
      : m
  )

  let responseText = ''
  const t0 = Date.now()

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: streamingMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    })

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? ''
      if (token) {
        responseText += token
        params.onToken(token)
      }
    }
  } catch (err) {
    console.error('OpenAI streaming error:', err)
    params.onError(new Error(SAFE_FALLBACK))
    return
  }

  const streamLatencyMs = Date.now() - t0

  // Overreach detection on the streamed response
  const overreach = detectOverreach(responseText)
  if (overreach.shouldDiscard) {
    await logSafetyEvent(supabase, {
      user_id: userId,
      event_type: 'overreach_blocked',
      trigger_source: 'policy',
      details: { flags: overreach.flags },
      message_id: userMsg.id,
    })
    params.onError(new Error(SAFE_FALLBACK))
    return
  }

  // Append tier 2 crisis resources if applicable
  if (tier2Crisis) {
    const crisisAppend = CRISIS_RESOURCES
    params.onToken(crisisAppend)
    responseText += crisisAppend
  }

  // ── Phase 2: Classification call (non-streaming, after stream) ────
  let classificationData: z.infer<typeof ClassificationSchema>
  let tokensIn = 0
  let tokensOut = 0

  try {
    const classificationCompletion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...promptMessages,
        { role: 'assistant', content: responseText },
        {
          role: 'user',
          content:
            'Now output ONLY the JSON classification and memory for the above response, matching the schema exactly. No other text.',
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1024,
    })

    tokensIn = classificationCompletion.usage?.prompt_tokens ?? 0
    tokensOut = classificationCompletion.usage?.completion_tokens ?? 0
    const rawClassification = classificationCompletion.choices[0]?.message?.content ?? ''

    classificationData = ClassificationSchema.parse(JSON.parse(rawClassification))
  } catch (err) {
    console.error('Classification call error:', err)
    // Fall back to safe defaults — don't fail the whole response
    classificationData = ClassificationSchema.parse({
      classification: {
        intent: 'explore',
        emotion: 'neutral',
        domain: 'general',
        risk_level: 'none',
        confidence: 0.8,
      },
      memory_suggestions: [],
      memorable_moments: [],
    })
  }

  const classification = classificationData.classification

  // Mode compliance: crisis risk_level → force anchor
  let effectiveMode = mode
  let anchorActive = false
  if (classification.risk_level === 'crisis' && mode !== 'anchor') {
    effectiveMode = 'anchor'
    anchorActive = true
  }

  // ── Step 8: Insert assistant message ─────────────────────
  const assistantMsg = await insertMessage(supabase, {
    conversation_id: conversationId,
    user_id: userId,
    role: 'assistant',
    content: responseText,
    intent: classification.intent,
    emotion: classification.emotion,
    domain: classification.domain,
    risk_level: classification.risk_level,
    confidence: classification.confidence,
    classification: classificationData,
    prompt_version: '1.0',
    model_provider: 'openai',
    model_name: 'gpt-4o',
    latency_ms: streamLatencyMs,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  })

  // ── Title generation (first exchange only) ────────────────
  let title: string | undefined
  if (sessionHistory.length === 0) {
    try {
      const titleCompletion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Generate a short title (3-6 words, no quotes) for this conversation:\nUser: ${message.slice(0, 200)}\nLumyn: ${responseText.slice(0, 200)}`,
          },
        ],
        max_tokens: 20,
        temperature: 0.5,
      })
      title = titleCompletion.choices[0]?.message?.content?.trim().slice(0, 60)
      if (title) {
        await supabase.from('lumyn_conversations').update({ title }).eq('id', conversationId)
      }
    } catch {
      // Non-critical — don't fail the response on title generation errors
    }
  }

  // ── Memory writes — Pro only ──────────────────────────────
  if (isPro) {
    // Process memorable moments
    await processMemorableMoments(
      userId,
      conversationId,
      classificationData.memorable_moments,
      [...sessionHistory, userMsg, assistantMsg],
      supabase
    )

    // Process memory suggestions → upsert/deprecate claims + log ops
    const memoryOps: InsertMemoryOpData[] = []
    for (const suggestion of classificationData.memory_suggestions) {
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

  params.onDone({
    conversationId,
    message: {
      id: assistantMsg.id,
      role: 'assistant',
      content: responseText,
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
    title,
  })
}
