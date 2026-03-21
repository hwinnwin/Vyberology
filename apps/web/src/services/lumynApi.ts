// ============================================================
// Lumyn API service (§7.1)
// Client-side wrapper for the lumyn-chat edge function (SSE)
// ============================================================

import { supabase } from '@/integrations/supabase/client'
import type { LumynInput, LumynMode, ChatResponse } from '@/types/lumyn'

export async function callLumynChat(params: {
  message: string
  conversationId?: string
  mode?: LumynMode
  vyberologyContext: LumynInput[]
  onToken: (token: string) => void
  onDone: (result: ChatResponse & { title?: string }) => void
  onError: (error: string) => void
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    params.onError('Not authenticated')
    return
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const response = await fetch(`${supabaseUrl}/functions/v1/lumyn-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      message: params.message,
      conversationId: params.conversationId,
      mode: params.mode,
      vyberologyContext: params.vyberologyContext,
    }),
  })

  if (!response.ok || !response.body) {
    params.onError(`HTTP ${response.status}`)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6))
        if (event.type === 'token') {
          params.onToken(event.content)
        } else if (event.type === 'done') {
          params.onDone(event)
        } else if (event.type === 'error') {
          params.onError(event.error)
        }
      } catch {
        // malformed event, skip
      }
    }
  }
}
