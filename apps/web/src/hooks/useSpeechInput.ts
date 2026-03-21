// ============================================================
// useSpeechInput — Web Speech API voice-to-text hook
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react'

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export type SpeechInputState = 'idle' | 'listening' | 'unsupported'

function getSpeechAPI(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export function useSpeechInput(onTranscript: (text: string) => void) {
  const supported = !!getSpeechAPI() && !isMobile()
  const [state, setState] = useState<SpeechInputState>(supported ? 'idle' : 'unsupported')

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const baseTextRef = useRef('')
  // All confirmed final text from the current session
  const finalTextRef = useRef('')
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  // Shared result handler — pure accumulation, no side effects
  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let newFinals = ''
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        newFinals += t
      } else {
        interim = t
      }
    }
    if (newFinals) finalTextRef.current += newFinals
    const base = baseTextRef.current
    const spoken = (finalTextRef.current + interim).trim()
    const combined = base ? base.trimEnd() + ' ' + spoken : spoken
    onTranscriptRef.current(combined)
  }, [])

  const startSession = useCallback((SpeechAPI: SpeechRecognitionConstructor, onEnd: () => void) => {
    const recognition = new SpeechAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-AU'
    recognition.onstart = () => setState('listening')
    recognition.onresult = handleResult
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      console.warn('[speech] error:', event.error)
      recognitionRef.current = null
      setState('idle')
    }
    recognition.onend = onEnd
    recognition.start()
    recognitionRef.current = recognition
    return recognition
  }, [handleResult])

  const start = useCallback((currentInputValue: string) => {
    const SpeechAPI = getSpeechAPI()
    if (!SpeechAPI) return

    // Toggle off if already listening
    if (recognitionRef.current) {
      const r = recognitionRef.current as SpeechRecognition & { _cancelLoop?: () => void }
      r._cancelLoop?.()
      r.abort()
      recognitionRef.current = null
      setState('idle')
      return
    }

    baseTextRef.current = currentInputValue
    finalTextRef.current = ''

    if (isMobile()) {
      // Mobile: single session per tap — no restart loop to avoid Android replay bug
      try {
        startSession(SpeechAPI, () => {
          recognitionRef.current = null
          setState('idle')
        })
      } catch (e) {
        console.warn('[speech] start failed:', e)
        setState('idle')
      }
    } else {
      // Desktop: restart loop so Chrome doesn't cut off after ~60s silence timeout
      const activeRef_local = { current: true }

      const scheduleRestart = () => {
        if (!activeRef_local.current) { setState('idle'); return }
        // Flush any pending interim into finals before restart
        setTimeout(() => {
          if (!activeRef_local.current) { setState('idle'); return }
          try {
            startSession(SpeechAPI, scheduleRestart)
          } catch (e) {
            console.warn('[speech] restart failed:', e)
            activeRef_local.current = false
            setState('idle')
          }
        }, 150)
      }

      // Store cancel fn on recognitionRef so toggle-off can reach it
      ;(recognitionRef as React.MutableRefObject<SpeechRecognition & { _cancelLoop?: () => void } | null>).current = null

      try {
        startSession(SpeechAPI, scheduleRestart)
        // Attach cancel so toggle-off cleans up the loop
        if (recognitionRef.current) {
          (recognitionRef.current as SpeechRecognition & { _cancelLoop?: () => void })._cancelLoop = () => {
            activeRef_local.current = false
          }
        }
      } catch (e) {
        console.warn('[speech] start failed:', e)
        setState('idle')
      }
    }
  }, [startSession])

  const stop = useCallback(() => {
    const r = recognitionRef.current as (SpeechRecognition & { _cancelLoop?: () => void }) | null
    r?._cancelLoop?.()
    r?.stop()
    recognitionRef.current = null
    setState('idle')
  }, [])

  useEffect(() => {
    return () => { recognitionRef.current?.abort() }
  }, [])

  return { state, start, stop }
}
