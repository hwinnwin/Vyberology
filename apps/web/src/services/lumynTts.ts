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
  if (!session) {
    onStateChange('idle')
    return
  }

  onStateChange('loading')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  // 15 second timeout on the fetch — OpenAI TTS can be slow
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), 15000)
  const combinedSignal = signal
    ? anyAbort(signal, timeoutController.signal)
    : timeoutController.signal

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/lumyn-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ text }),
      signal: combinedSignal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('[lumyn-tts] HTTP', response.status, await response.text().catch(() => ''))
      onStateChange('idle')
      return
    }

    const blob = await response.blob()
    if (combinedSignal.aborted) {
      onStateChange('idle')
      return
    }

    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    onStateChange('playing')

    await new Promise<void>((resolve) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve() }
      audio.onerror = (e) => { console.error('[lumyn-tts] audio error', e); URL.revokeObjectURL(url); resolve() }
      if (signal) {
        signal.addEventListener('abort', () => {
          audio.pause()
          URL.revokeObjectURL(url)
          resolve()
        }, { once: true })
      }
      audio.play().catch((e) => { console.error('[lumyn-tts] play() failed', e); resolve() })
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if ((err as Error).name !== 'AbortError') {
      console.error('[lumyn-tts]', err)
    }
  } finally {
    onStateChange('idle')
  }
}

// Combine two AbortSignals — aborts when either fires
function anyAbort(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const s of signals) {
    if (s.aborted) { controller.abort(); break }
    s.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return controller.signal
}
