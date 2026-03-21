// ============================================================
// useSpeechInput — Web Speech API voice-to-text hook
// Streams interim transcripts into the chat input in real time
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

export function useSpeechInput(onTranscript: (text: string) => void) {
  const supported = !!getSpeechAPI()
  const [state, setState] = useState<SpeechInputState>(supported ? 'idle' : 'unsupported')

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const activeRef = useRef(false)       // user wants mic on
  const restartingRef = useRef(false)   // restart already scheduled — prevents double-restart
  const baseTextRef = useRef('')
  const finalAccumulatedRef = useRef('')
  const lastInterimRef = useRef('')
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  const attachHandlers = useCallback((recognition: SpeechRecognition, SpeechAPI: SpeechRecognitionConstructor) => {
    recognition.onstart = () => {
      restartingRef.current = false
      setState('listening')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newFinals = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          newFinals += t
        } else {
          interim += t
        }
      }
      if (newFinals) {
        finalAccumulatedRef.current += newFinals
        lastInterimRef.current = ''
      }
      lastInterimRef.current = interim

      const base = baseTextRef.current
      const spoken = (finalAccumulatedRef.current + interim).trim()
      const combined = base ? base.trimEnd() + ' ' + spoken : spoken
      onTranscriptRef.current(combined)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // These are expected on Android — don't treat as fatal
      if (event.error === 'no-speech' || event.error === 'aborted') return
      console.warn('[speech] error:', event.error)
      // For other errors (network, not-allowed) stop cleanly
      activeRef.current = false
      restartingRef.current = false
      recognitionRef.current = null
      setState('idle')
    }

    recognition.onend = () => {
      recognitionRef.current = null

      if (!activeRef.current || restartingRef.current) {
        if (!activeRef.current) setState('idle')
        return
      }

      // Flush pending interim into finals before restart so words aren't replayed
      if (lastInterimRef.current) {
        finalAccumulatedRef.current += lastInterimRef.current
        lastInterimRef.current = ''
      }

      restartingRef.current = true
      setTimeout(() => {
        if (!activeRef.current) {
          restartingRef.current = false
          setState('idle')
          return
        }
        try {
          const next = new SpeechAPI()
          next.continuous = true
          next.interimResults = true
          next.lang = 'en-AU'
          attachHandlers(next, SpeechAPI)
          next.start()
          recognitionRef.current = next
        } catch (e) {
          console.warn('[speech] restart failed:', e)
          activeRef.current = false
          restartingRef.current = false
          setState('idle')
        }
      }, 200)
    }
  }, [])

  const start = useCallback((currentInputValue: string) => {
    const SpeechAPI = getSpeechAPI()
    if (!SpeechAPI) return

    // Toggle off if already active
    if (activeRef.current) {
      activeRef.current = false
      restartingRef.current = false
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setState('idle')
      return
    }

    baseTextRef.current = currentInputValue
    finalAccumulatedRef.current = ''
    lastInterimRef.current = ''
    activeRef.current = true
    restartingRef.current = false

    try {
      const recognition = new SpeechAPI()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-AU'
      attachHandlers(recognition, SpeechAPI)
      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {
      console.warn('[speech] start failed:', e)
      activeRef.current = false
      setState('idle')
    }
  }, [attachHandlers])

  const stop = useCallback(() => {
    activeRef.current = false
    restartingRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setState('idle')
  }, [])

  useEffect(() => {
    return () => {
      activeRef.current = false
      restartingRef.current = false
      recognitionRef.current?.abort()
    }
  }, [])

  return { state, start, stop }
}
