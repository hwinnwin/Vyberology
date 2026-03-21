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
  // true while the user intends to keep listening (even across restarts)
  const activeRef = useRef<boolean>(false)
  const baseTextRef = useRef<string>('')
  // Accumulates confirmed final segments during a continuous session
  const finalAccumulatedRef = useRef<string>('')
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  const createAndStart = useCallback(() => {
    const SpeechAPI = getSpeechAPI()
    if (!SpeechAPI) return

    const recognition = new SpeechAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-AU'

    recognition.onstart = () => setState('listening')

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalAccumulatedRef.current += event.results[i][0].transcript
        }
      }

      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) {
          interim += event.results[i][0].transcript
        }
      }

      const base = baseTextRef.current
      const spoken = (finalAccumulatedRef.current + interim).trim()
      const combined = base ? base.trimEnd() + ' ' + spoken : spoken
      onTranscriptRef.current(combined)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return
      console.warn('[speech] error:', event.error)
    }

    recognition.onend = () => {
      recognitionRef.current = null
      // If the user hasn't stopped, restart after a brief delay to avoid
      // InvalidStateError from calling start() too quickly after end
      if (activeRef.current) {
        setTimeout(() => {
          if (!activeRef.current) return
          try {
            const next = new SpeechAPI()
            next.continuous = true
            next.interimResults = true
            next.lang = 'en-AU'
            next.onstart = recognition.onstart
            next.onresult = recognition.onresult
            next.onerror = recognition.onerror
            next.onend = recognition.onend
            next.start()
            recognitionRef.current = next
          } catch (e) {
            console.warn('[speech] restart failed:', e)
            activeRef.current = false
            setState('idle')
          }
        }, 150)
      } else {
        setState('idle')
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {
      console.warn('[speech] start failed:', e)
      activeRef.current = false
      setState('idle')
    }
  }, [])

  const start = useCallback((currentInputValue: string) => {
    const SpeechAPI = getSpeechAPI()
    if (!SpeechAPI) return

    // If already listening, stop
    if (activeRef.current) {
      activeRef.current = false
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setState('idle')
      return
    }

    baseTextRef.current = currentInputValue
    finalAccumulatedRef.current = ''
    activeRef.current = true
    createAndStart()
  }, [createAndStart])

  const stop = useCallback(() => {
    activeRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setState('idle')
  }, [])

  useEffect(() => {
    return () => {
      activeRef.current = false
      recognitionRef.current?.abort()
    }
  }, [])

  return { state, start, stop }
}
