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
  const baseTextRef = useRef<string>('')
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  const start = useCallback((currentInputValue: string) => {
    const SpeechAPI = getSpeechAPI()
    if (!SpeechAPI) return

    // If already listening, stop
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
      setState('idle')
      return
    }

    const recognition = new SpeechAPI()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-AU'

    baseTextRef.current = currentInputValue

    recognition.onstart = () => setState('listening')

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      const base = baseTextRef.current
      const spoken = final || interim
      const combined = base ? base.trimEnd() + ' ' + spoken : spoken
      onTranscriptRef.current(combined)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('[speech] error:', event.error)
      recognitionRef.current = null
      setState('idle')
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setState('idle')
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {
      console.warn('[speech] start failed:', e)
      setState('idle')
    }
  }, []) // stable — uses refs for mutable values

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setState('idle')
  }, [])

  useEffect(() => {
    return () => { recognitionRef.current?.abort() }
  }, [])

  return { state, start, stop }
}
