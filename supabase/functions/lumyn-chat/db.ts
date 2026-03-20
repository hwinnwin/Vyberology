// ============================================================
// Lumyn Intelligence Layer — DB Layer (§4.2)
// All Supabase queries against lumyn_* tables
// ============================================================

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js'
import type {
  LumynConversation,
  LumynMessage,
  LumynUserModel,
  LumynClaim,
  LumynPattern,
  LumynGuidingPrinciple,
  LumynMode,
  InsertMessageData,
  InsertSafetyEventData,
  InsertMemoryOpData,
} from './types.ts'

// ─────────────────────────────────────────────
// Client factory — called once per request in index.ts
// ─────────────────────────────────────────────

export function createSupabaseClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(url, key)
}

// ─────────────────────────────────────────────
// Lumyn Pro entitlement
// ─────────────────────────────────────────────

export type LumynEntitlement = {
  lumyn_pro: boolean
  lumyn_pro_until: string | null
  lumyn_messages_used: number
}

export async function getUserEntitlement(
  supabase: SupabaseClient,
  userId: string
): Promise<LumynEntitlement> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('lumyn_pro, lumyn_pro_until, lumyn_messages_used')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    // No profile row → treat as free tier, 0 messages used
    return { lumyn_pro: false, lumyn_pro_until: null, lumyn_messages_used: 0 }
  }

  return {
    lumyn_pro: data.lumyn_pro ?? false,
    lumyn_pro_until: data.lumyn_pro_until ?? null,
    lumyn_messages_used: data.lumyn_messages_used ?? 0,
  }
}

/**
 * Single entitlement resolver — use everywhere, never duplicate this logic.
 */
export function resolveLumynEntitlement(entitlement: LumynEntitlement): boolean {
  return (
    entitlement.lumyn_pro &&
    (entitlement.lumyn_pro_until === null ||
      new Date(entitlement.lumyn_pro_until) > new Date())
  )
}

// ─────────────────────────────────────────────
// Conversations
// ─────────────────────────────────────────────

export async function getOrCreateConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string | undefined,
  mode: LumynMode
): Promise<LumynConversation> {
  if (conversationId) {
    const { data, error } = await supabase
      .from('lumyn_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (!error && data) return data as LumynConversation
  }

  const { data, error } = await supabase
    .from('lumyn_conversations')
    .insert({ user_id: userId, mode })
    .select()
    .single()

  if (error) throw new Error(`Failed to create conversation: ${error.message}`)
  return data as LumynConversation
}

export async function closeStaleConversations(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  // Close open conversations older than 24 hours with no recent messages
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  await supabase
    .from('lumyn_conversations')
    .update({ status: 'closed', ended_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'open')
    .lt('created_at', cutoff)
}

// ─────────────────────────────────────────────
// User model
// ─────────────────────────────────────────────

export async function getOrCreateUserModel(
  supabase: SupabaseClient,
  userId: string
): Promise<LumynUserModel> {
  const { data, error } = await supabase
    .from('lumyn_user_models')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!error && data) return data as LumynUserModel

  const { data: created, error: createError } = await supabase
    .from('lumyn_user_models')
    .insert({ user_id: userId })
    .select()
    .single()

  if (createError) throw new Error(`Failed to create user model: ${createError.message}`)
  return created as LumynUserModel
}

// ─────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────

export async function getSessionHistory(
  supabase: SupabaseClient,
  conversationId: string,
  limit: number
): Promise<LumynMessage[]> {
  const { data, error } = await supabase
    .from('lumyn_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`Failed to get session history: ${error.message}`)
  return (data ?? []) as LumynMessage[]
}

export async function insertMessage(
  supabase: SupabaseClient,
  data: InsertMessageData
): Promise<LumynMessage> {
  const { data: row, error } = await supabase
    .from('lumyn_messages')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(`Failed to insert message: ${error.message}`)
  return row as LumynMessage
}

// ─────────────────────────────────────────────
// Claims
// ─────────────────────────────────────────────

export async function getClaims(
  supabase: SupabaseClient,
  userId: string
): Promise<LumynClaim[]> {
  const { data, error } = await supabase
    .from('lumyn_claims')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('confidence', { ascending: false })

  if (error) throw new Error(`Failed to get claims: ${error.message}`)
  return (data ?? []) as LumynClaim[]
}

export async function upsertClaim(
  supabase: SupabaseClient,
  userId: string,
  claim: {
    type: string
    key: string
    data: Record<string, unknown>
    confidence: number
    source_conversation_id?: string
  }
): Promise<LumynClaim> {
  const { data, error } = await supabase
    .from('lumyn_claims')
    .upsert(
      {
        user_id: userId,
        type: claim.type,
        key: claim.key,
        data: claim.data,
        confidence: claim.confidence,
        source_conversation_id: claim.source_conversation_id,
        status: 'active',
      },
      { onConflict: 'user_id,key' }
    )
    .select()
    .single()

  if (error) throw new Error(`Failed to upsert claim: ${error.message}`)
  return data as LumynClaim
}

export async function deprecateClaim(
  supabase: SupabaseClient,
  claimId: string
): Promise<void> {
  const { error } = await supabase
    .from('lumyn_claims')
    .update({ status: 'deprecated' })
    .eq('id', claimId)

  if (error) throw new Error(`Failed to deprecate claim: ${error.message}`)
}

// ─────────────────────────────────────────────
// Patterns
// ─────────────────────────────────────────────

export async function getRecentPatterns(
  supabase: SupabaseClient,
  userId: string,
  limit: number
): Promise<LumynPattern[]> {
  const { data, error } = await supabase
    .from('lumyn_patterns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to get patterns: ${error.message}`)
  return (data ?? []) as LumynPattern[]
}

// ─────────────────────────────────────────────
// Guiding principles
// ─────────────────────────────────────────────

export async function getGuidingPrinciples(
  supabase: SupabaseClient,
  userId: string
): Promise<LumynGuidingPrinciple[]> {
  const { data, error } = await supabase
    .from('lumyn_guiding_principles')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)

  if (error) throw new Error(`Failed to get guiding principles: ${error.message}`)
  return (data ?? []) as LumynGuidingPrinciple[]
}

// ─────────────────────────────────────────────
// Memorable moments (§6.3)
// ─────────────────────────────────────────────

export async function getMemorableMoments(
  supabase: SupabaseClient,
  userId: string,
  limit: number
): Promise<LumynMessage[]> {
  const { data, error } = await supabase
    .from('lumyn_messages')
    .select('*')
    .eq('user_id', userId)
    .not('moment_type', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to get memorable moments: ${error.message}`)
  return (data ?? []) as LumynMessage[]
}

// ─────────────────────────────────────────────
// Safety events
// ─────────────────────────────────────────────

export async function logSafetyEvent(
  supabase: SupabaseClient,
  data: InsertSafetyEventData
): Promise<void> {
  const { error } = await supabase.from('lumyn_safety_events').insert(data)
  if (error) throw new Error(`Failed to log safety event: ${error.message}`)
}

// ─────────────────────────────────────────────
// Memory ops ledger
// ─────────────────────────────────────────────

export async function logMemoryOps(
  supabase: SupabaseClient,
  ops: InsertMemoryOpData[]
): Promise<void> {
  if (ops.length === 0) return
  const { error } = await supabase.from('lumyn_memory_ops').insert(ops)
  if (error) throw new Error(`Failed to log memory ops: ${error.message}`)
}

// ─────────────────────────────────────────────
// Rate limiting (§3.2) — atomic upsert
// ─────────────────────────────────────────────

export async function upsertRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ count_hour: number; count_day: number }> {
  // Truncate current time to the hour
  const now = new Date()
  const windowHour = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours()
  ).toISOString()
  const windowDay = now.toISOString().slice(0, 10) // YYYY-MM-DD

  // Atomic upsert: increment counters, return new values
  const { data, error } = await supabase.rpc('lumyn_upsert_rate_limit', {
    p_user_id: userId,
    p_window_hour: windowHour,
    p_window_day: windowDay,
  })

  if (error) {
    // If RPC doesn't exist yet, fall back to manual upsert
    return await upsertRateLimitFallback(supabase, userId, windowHour, windowDay)
  }

  return data as { count_hour: number; count_day: number }
}

async function upsertRateLimitFallback(
  supabase: SupabaseClient,
  userId: string,
  windowHour: string,
  windowDay: string
): Promise<{ count_hour: number; count_day: number }> {
  // Try to get existing row for this hour
  const { data: existing } = await supabase
    .from('lumyn_rate_limits')
    .select('id, count_hour, count_day')
    .eq('user_id', userId)
    .eq('window_hour', windowHour)
    .single()

  if (existing) {
    const newHour = existing.count_hour + 1
    const newDay = existing.count_day + 1
    await supabase
      .from('lumyn_rate_limits')
      .update({ count_hour: newHour, count_day: newDay })
      .eq('id', existing.id)
    return { count_hour: newHour, count_day: newDay }
  }

  // No row for this hour — check today's total across all hours
  const { data: dayRows } = await supabase
    .from('lumyn_rate_limits')
    .select('count_hour')
    .eq('user_id', userId)
    .eq('window_day', windowDay)

  const dayTotal = (dayRows ?? []).reduce((sum, r) => sum + r.count_hour, 0)

  await supabase.from('lumyn_rate_limits').insert({
    user_id: userId,
    window_hour: windowHour,
    window_day: windowDay,
    count_hour: 1,
    count_day: dayTotal + 1,
  })

  return { count_hour: 1, count_day: dayTotal + 1 }
}
