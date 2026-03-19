// ============================================================
// Lumyn — Client-side types (§7.2)
// Mirrors edge function types.ts — client-facing subset only
// ============================================================

export type LumynInput = { label: string; value: string }

export type LumynMode = 'reflect' | 'illuminate' | 'anchor' | 'silent'

export type LumynIntent = 'vent' | 'decide' | 'plan' | 'crisis' | 'explore' | 'curiosity'

export type LumynDomain =
  | 'numerology'
  | 'career'
  | 'relationships'
  | 'identity'
  | 'health'
  | 'money'
  | 'existential'
  | 'general'

export type ChatResponse = {
  conversationId: string
  message: {
    id: string
    role: 'assistant'
    content: string
    created_at: string
  }
  mode: LumynMode
  classification: {
    intent: LumynIntent
    emotion: string
    domain: LumynDomain
  }
  client_directives: {
    crisis_banner: boolean
    anchor_active: boolean
  }
}
