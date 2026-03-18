// ============================================================
// Lumyn API service (§7.1)
// Client-side wrapper for the lumyn-chat edge function
// ============================================================

import { supabase } from '@/integrations/supabase/client'
import type { LumynInput, LumynMode, ChatResponse } from '@/types/lumyn'

export async function callLumynChat(params: {
  message: string
  conversationId?: string
  mode?: LumynMode
  vyberologyContext: LumynInput[]
}): Promise<ChatResponse> {
  const { data, error } = await supabase.functions.invoke('lumyn-chat', {
    body: params,
  })

  if (error) {
    throw new Error(`Lumyn chat failed: ${error.message}`)
  }

  return data as ChatResponse
}
