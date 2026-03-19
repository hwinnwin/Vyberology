// ============================================================
// Lumyn Intelligence Layer — Memory Layer (§6)
// Memorable moments + conversation summary generation
// ============================================================

import OpenAI from 'npm:openai'
import { SupabaseClient } from 'npm:@supabase/supabase-js'
import type { LumynMessage, LLMMemorableMoment } from './types.ts'

// ─────────────────────────────────────────────
// processMemorableMoments (§6.1)
// ─────────────────────────────────────────────

// Confidence thresholds per moment slot (diminishing)
const MOMENT_THRESHOLDS = [0.65, 0.70, 0.75]

export async function processMemorableMoments(
  userId: string,
  conversationId: string,
  llmMoments: LLMMemorableMoment[],
  sessionHistory: LumynMessage[],
  supabase: SupabaseClient
): Promise<void> {
  if (llmMoments.length === 0) return

  // Count existing moments in this conversation
  const { data: existing } = await supabase
    .from('lumyn_messages')
    .select('id, content')
    .eq('conversation_id', conversationId)
    .not('moment_type', 'is', null)

  const existingMoments = (existing ?? []) as Array<{ id: string; content: string }>
  let momentCount = existingMoments.length

  for (const moment of llmMoments) {
    if (momentCount >= 3) break

    // Gate: confidence threshold for this slot
    const threshold = MOMENT_THRESHOLDS[momentCount] ?? 0.75
    if (moment.selection_confidence < threshold) continue

    // Dedup: skip if near-identical quote already exists in this conversation
    const isDuplicate = existingMoments.some((m) =>
      m.content.toLowerCase().includes(moment.quote.toLowerCase()) ||
      moment.quote.toLowerCase().includes(m.content.toLowerCase().slice(0, 50))
    )
    if (isDuplicate) continue

    // Resolve quote to message_id from session history
    const messageId = resolveQuoteToMessageId(moment.quote, sessionHistory)
    if (!messageId) continue

    // Write moment flag onto the resolved message
    const { error } = await supabase
      .from('lumyn_messages')
      .update({
        moment_type: moment.moment_type,
        moment_confidence: moment.selection_confidence,
      })
      .eq('id', messageId)

    if (!error) {
      existingMoments.push({ id: messageId, content: moment.quote })
      momentCount++
    }
  }
}

// Resolve a quote string to the best matching message_id in session history
function resolveQuoteToMessageId(
  quote: string,
  sessionHistory: LumynMessage[]
): string | null {
  if (sessionHistory.length === 0) return null

  const quoteLower = quote.toLowerCase()

  // 1. Exact match
  const exact = sessionHistory.find((m) => m.content.toLowerCase() === quoteLower)
  if (exact) return exact.id

  // 2. Near match: message content contains the quote
  const near = sessionHistory.find((m) =>
    m.content.toLowerCase().includes(quoteLower)
  )
  if (near) return near.id

  // 3. Quote contains a significant substring of a message
  const partial = sessionHistory.find((m) => {
    const msgLower = m.content.toLowerCase()
    return quoteLower.includes(msgLower.slice(0, Math.min(50, msgLower.length)))
  })
  if (partial) return partial.id

  // 4. Fallback: most recent assistant message
  const assistantMessages = sessionHistory.filter((m) => m.role === 'assistant')
  if (assistantMessages.length > 0) {
    return assistantMessages[assistantMessages.length - 1].id
  }

  // 5. Final fallback: most recent message of any role
  return sessionHistory[sessionHistory.length - 1]?.id ?? null
}

// ─────────────────────────────────────────────
// generateConversationSummary (§6.2)
// Called async / non-blocking when conversation closes
// ─────────────────────────────────────────────

export async function generateConversationSummary(
  conversationId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Fetch full conversation messages
    const { data: messages, error } = await supabase
      .from('lumyn_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error || !messages || messages.length === 0) return

    const transcript = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'User' : 'Lumyn'}: ${m.content}`
      )
      .join('\n')

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return

    const client = new OpenAI({ apiKey })

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that summarises conversations concisely.',
        },
        {
          role: 'user',
          content:
            `Summarise this conversation in 3 sentences, focusing on key insights and numerological themes.\n\n${transcript.slice(0, 8000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const summary = completion.choices[0]?.message?.content?.trim()
    if (!summary) return

    await supabase
      .from('lumyn_conversations')
      .update({ session_summary: summary, status: 'closed', ended_at: new Date().toISOString() })
      .eq('id', conversationId)
  } catch {
    // Non-blocking — swallow errors silently
  }
}
