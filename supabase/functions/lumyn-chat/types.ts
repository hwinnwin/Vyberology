// ============================================================
// Lumyn Intelligence Layer — Canonical Types
// Edge function definitions (§8 of design spec)
// ============================================================

// ─────────────────────────────────────────────
// Modes, intent, domain, risk
// ─────────────────────────────────────────────

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

export type LumynRisk = 'none' | 'low' | 'medium' | 'high' | 'crisis'

// ─────────────────────────────────────────────
// User model
// ─────────────────────────────────────────────

export type LumynTone = 'soft' | 'neutral' | 'firm' | 'no-bs'

// ─────────────────────────────────────────────
// Memory
// ─────────────────────────────────────────────

export type LumynClaimType =
  | 'value'
  | 'goal'
  | 'stressor'
  | 'preference'
  | 'constraint'
  | 'identity_fact'
  | 'decision_style'
  | 'growth_area'

export type LumynMomentType =
  | 'decision'
  | 'revelation'
  | 'emotion'
  | 'commitment'
  | 'boundary'

// 'ignore' and 'retract' are system-generated only — LLM cannot suggest them
export type LumynMemoryOp = 'create' | 'update' | 'deprecate' | 'ignore' | 'retract'

// ─────────────────────────────────────────────
// Safety
// ─────────────────────────────────────────────

export type LumynSafetyEvent = 'crisis_detected' | 'overreach_blocked' | 'escalation'

// ─────────────────────────────────────────────
// Shared input type (matches client lumynContext.ts output)
// ─────────────────────────────────────────────

export type LumynInput = { label: string; value: string }

// ─────────────────────────────────────────────
// DB row types
// ─────────────────────────────────────────────

export type LumynConversation = {
  id: string
  user_id: string
  title?: string
  mode: LumynMode
  status: string
  session_summary?: string
  metadata: Record<string, unknown>
  created_at: string
  ended_at?: string
}

export type LumynMessage = {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  intent?: LumynIntent
  emotion?: string
  arousal?: number
  domain?: LumynDomain
  risk_level?: LumynRisk
  confidence?: number
  moment_type?: LumynMomentType
  moment_confidence?: number
  classification?: unknown
  prompt_version?: string
  model_provider?: string
  model_name?: string
  latency_ms?: number
  tokens_in?: number
  tokens_out?: number
  created_at: string
}

export type LumynUserModel = {
  user_id: string
  adaptive_stage: number
  interaction_count: number
  preferred_tone: LumynTone
  comm_style?: string
  snapshot: unknown
  created_at: string
  updated_at: string
}

export type LumynClaim = {
  id: string
  user_id: string
  type: LumynClaimType
  key: string
  data: unknown
  confidence: number
  status: 'active' | 'deprecated' | 'retracted'
  evidence_count: number
  source_conversation_id?: string
  created_at: string
  updated_at: string
}

export type LumynPattern = {
  id: string
  user_id: string
  domain: LumynDomain
  emotional_sig: unknown
  action_taken?: string
  outcome?: string
  user_reflection?: string
  confidence?: number
  source_msg_id?: string
  created_at: string
}

export type LumynGuidingPrinciple = {
  id: string
  user_id: string
  principle: string
  active: boolean
  created_at: string
}

// ─────────────────────────────────────────────
// Context bundle (db.ts → orchestrator)
// ─────────────────────────────────────────────

export type ContextBundle = {
  conversation: LumynConversation
  userModel: LumynUserModel
  sessionHistory: LumynMessage[]
  claims: LumynClaim[]
  patterns: LumynPattern[]
  principles: LumynGuidingPrinciple[]
  memorableMoments: LumynMessage[]
}

// ─────────────────────────────────────────────
// Insert data types (used by db.ts)
// ─────────────────────────────────────────────

export type InsertMessageData = {
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  intent?: LumynIntent
  emotion?: string
  arousal?: number
  domain?: LumynDomain
  risk_level?: LumynRisk
  confidence?: number
  moment_type?: LumynMomentType
  moment_confidence?: number
  classification?: unknown
  prompt_version?: string
  model_provider?: string
  model_name?: string
  latency_ms?: number
  tokens_in?: number
  tokens_out?: number
}

export type InsertSafetyEventData = {
  user_id: string
  event_type: LumynSafetyEvent
  trigger_source?: 'keyword' | 'pattern' | 'policy' | 'llm_classification'
  details?: Record<string, unknown>
  message_id?: string
}

export type InsertMemoryOpData = {
  user_id: string
  message_id?: string
  op_type: LumynMemoryOp
  target_claim_id?: string
  target_desc?: string
  reason?: string
  details?: Record<string, unknown>
}

// ─────────────────────────────────────────────
// LLM response types
// ─────────────────────────────────────────────

export type LLMMemorySuggestion = {
  op: 'create' | 'update' | 'deprecate'
  type: string
  key: string
  data: Record<string, unknown>
  confidence: number
  reason: string
}

export type LLMMemorableMoment = {
  quote: string
  moment_type: LumynMomentType
  selection_confidence: number
}

export type LLMResponse = {
  response: string
  classification: {
    intent: LumynIntent
    emotion: string
    domain: LumynDomain
    risk_level: LumynRisk
    confidence: number
  }
  memory_suggestions: LLMMemorySuggestion[]
  memorable_moments: LLMMemorableMoment[]
}

// ─────────────────────────────────────────────
// API response (returned to client)
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// OpenAI message type
// ─────────────────────────────────────────────

export type LLMMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}
