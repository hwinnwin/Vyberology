// ============================================================
// Lumyn TTS service — calls lumyn-tts edge function
// Returns an HTMLAudioElement ready to play
// ============================================================

import { supabase } from '@/integrations/supabase/client'

export type TtsState = 'idle' | 'loading' | 'playing'

export async function speakLumynMessage(
  text: string,
  onStateChange: (state: TtsState) => void,
  signal?: AbortSignal
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  onStateChange('loading')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/lumyn-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ text }),
      signal,
    })

    if (!response.ok || !response.body) {
      onStateChange('idle')
      return
    }

    const blob = await response.blob()
    if (signal?.aborted) {
      onStateChange('idle')
      return
    }

    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    onStateChange('playing')

    await new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url)
        resolve()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        resolve()
      }
      if (signal) {
        signal.addEventListener('abort', () => {
          audio.pause()
          URL.revokeObjectURL(url)
          resolve()
        }, { once: true })
      }
      audio.play().catch(() => resolve())
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    console.error('[lumyn-tts]', err)
  } finally {
    onStateChange('idle')
  }
}
