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

export function useSpeechInput(onTranscript: (text: string) => void) {
  const [state, setState] = useState<SpeechInputState>(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    return SpeechRecognitionAPI ? 'idle' : 'unsupported'
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const baseTextRef = useRef<string>('') // text already in input before mic started

  const start = useCallback((currentInputValue: string) => {
    if (state === 'unsupported') return

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    // Stop any existing session
    recognitionRef.current?.abort()

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-AU'

    // Preserve whatever was already typed
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

      // Stream interim results into the input as the user speaks
      const combined = baseTextRef.current
        ? baseTextRef.current.trimEnd() + ' ' + (final || interim)
        : final || interim
      onTranscript(combined)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        setState('idle')
      }
    }

    recognition.onend = () => setState('idle')

    recognition.start()
    recognitionRef.current = recognition
  }, [state, onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setState('idle')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  return { state, start, stop }
}
