-- ============================================================
-- Lumyn Intelligence Layer — DB Migration
-- Chunk 1 of the Lumyn implementation
-- ============================================================

-- ─────────────────────────────────────────────
-- TIER 0: Session container
-- ─────────────────────────────────────────────

CREATE TABLE lumyn_conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text,
  mode            text NOT NULL DEFAULT 'reflect'
                  CHECK (mode IN ('reflect','illuminate','anchor','silent')),
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','closed','archived')),
  session_summary text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  ended_at        timestamptz
);

-- ─────────────────────────────────────────────
-- TIER 1: Observability
-- ─────────────────────────────────────────────

CREATE TABLE lumyn_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES lumyn_conversations(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             text NOT NULL CHECK (role IN ('user','assistant','system')),
  content          text NOT NULL,
  -- Promoted classification columns (from LLM JSON output)
  intent           text CHECK (intent IN ('vent','decide','plan','crisis','explore','curiosity')),
  emotion          text,
  arousal          numeric(3,2),
  domain           text CHECK (domain IN (
                     'numerology','career','relationships','identity',
                     'health','money','existential','general')),
  risk_level       text CHECK (risk_level IN ('none','low','medium','high','crisis')),
  confidence       numeric(3,2),
  -- Memorable moment flag (null = not a moment)
  moment_type      text CHECK (moment_type IN (
                     'decision','revelation','emotion','commitment','boundary')),
  moment_confidence numeric(3,2),
  -- Raw classification blob
  classification   jsonb,
  -- Observability
  prompt_version   text,
  model_provider   text,
  model_name       text,
  latency_ms       integer,
  tokens_in        integer,
  tokens_out       integer,
  created_at       timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TIER 1: User model
-- ─────────────────────────────────────────────

CREATE TABLE lumyn_user_models (
  user_id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  adaptive_stage    integer NOT NULL DEFAULT 1 CHECK (adaptive_stage BETWEEN 1 AND 4),
  interaction_count integer NOT NULL DEFAULT 0,
  preferred_tone    text DEFAULT 'neutral'
                    CHECK (preferred_tone IN ('soft','neutral','firm','no-bs')),
  comm_style        text,
  snapshot          jsonb DEFAULT '{}',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TIER 1: Memory — claims
-- ─────────────────────────────────────────────

CREATE TABLE lumyn_claims (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                   text NOT NULL CHECK (type IN (
                           'value','goal','stressor','preference','constraint',
                           'identity_fact','decision_style','growth_area')),
  key                    text NOT NULL,
  data                   jsonb NOT NULL DEFAULT '{}',
  confidence             numeric(3,2) NOT NULL DEFAULT 0.5,
  status                 text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','deprecated','retracted')),
  evidence_count         integer NOT NULL DEFAULT 0,
  source_conversation_id uuid REFERENCES lumyn_conversations(id),
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  UNIQUE (user_id, key)
);

-- ─────────────────────────────────────────────
-- TIER 1: Memory — evidence
-- ─────────────────────────────────────────────

CREATE TABLE lumyn_evidence (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id      uuid NOT NULL REFERENCES lumyn_claims(id) ON DELETE CASCADE,
  evidence_kind text NOT NULL CHECK (evidence_kind IN (
                   'message','user_edit','system_inference','onboarding')),
  source_msg_id uuid REFERENCES lumyn_messages(id),
  strength      numeric(3,2),
  summary       text,
  created_at    timestamptz DEFAULT now()
);

-- Enforce: evidence.user_id must match the claim's user_id
CREATE OR REPLACE FUNCTION check_evidence_user_matches_claim()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM lumyn_claims WHERE id = NEW.claim_id) THEN
    RAISE EXCEPTION 'evidence user_id does not match claim user_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evidence_user_matches_claim
  BEFORE INSERT OR UPDATE ON lumyn_evidence
  FOR EACH ROW EXECUTE FUNCTION check_evidence_user_matches_claim();

-- ─────────────────────────────────────────────
-- TIER 1: Memory — patterns
-- ─────────────────────────────────────────────

CREATE TABLE lumyn_patterns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain          text NOT NULL CHECK (domain IN (
                    'numerology','career','identity','relationships',
                    'health','money','existential','general')),
  emotional_sig   jsonb DEFAULT '{}',
  action_taken    text,
  outcome         text,
  user_reflection text,
  confidence      numeric(3,2),
  source_msg_id   uuid REFERENCES lumyn_messages(id),
  created_at      timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Append-only ledgers
-- ─────────────────────────────────────────────

CREATE TABLE lumyn_memory_ops (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id      uuid REFERENCES lumyn_messages(id),
  op_type         text NOT NULL CHECK (op_type IN (
                    'create','update','deprecate','ignore','retract')),
  target_claim_id uuid REFERENCES lumyn_claims(id),
  target_desc     text,
  reason          text,
  details         jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE lumyn_safety_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type     text NOT NULL CHECK (event_type IN (
                   'crisis_detected','overreach_blocked','escalation')),
  trigger_source text CHECK (trigger_source IN (
                   'keyword','pattern','policy','llm_classification')),
  details        jsonb DEFAULT '{}',
  message_id     uuid REFERENCES lumyn_messages(id),
  created_at     timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- User-authored
-- ─────────────────────────────────────────────

CREATE TABLE lumyn_guiding_principles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  principle  text NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Rate limiting (persistent)
-- ─────────────────────────────────────────────

CREATE TABLE lumyn_rate_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_hour timestamptz NOT NULL,
  window_day  date NOT NULL,
  count_hour  integer NOT NULL DEFAULT 0,
  count_day   integer NOT NULL DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, window_hour)
);

-- ============================================================
-- TRIGGERS — updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lumyn_user_models_updated_at
  BEFORE UPDATE ON lumyn_user_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER lumyn_claims_updated_at
  BEFORE UPDATE ON lumyn_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER lumyn_rate_limits_updated_at
  BEFORE UPDATE ON lumyn_rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INDEXES
-- ============================================================

-- Session history retrieval (most frequent query)
CREATE INDEX ON lumyn_messages (conversation_id, created_at);

-- Claim lookup by user + status
CREATE INDEX ON lumyn_claims (user_id, status, confidence DESC);

-- Pattern retrieval by user + recency
CREATE INDEX ON lumyn_patterns (user_id, created_at DESC);

-- Memorable moment retrieval by user + recency
CREATE INDEX ON lumyn_messages (user_id, created_at DESC)
  WHERE moment_type IS NOT NULL;

-- Safety event lookup
CREATE INDEX ON lumyn_safety_events (user_id, created_at DESC);

-- Rate limit lookup
CREATE INDEX ON lumyn_rate_limits (user_id, window_hour);

-- ============================================================
-- RLS — Enable on all tables
-- ============================================================

ALTER TABLE lumyn_conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumyn_messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumyn_user_models        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumyn_claims             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumyn_evidence           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumyn_guiding_principles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumyn_memory_ops         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumyn_safety_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumyn_patterns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumyn_rate_limits        ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- Mutable tables — full CRUD for owner
-- ─────────────────────────────────────────────

-- lumyn_conversations
CREATE POLICY "Users can manage own conversations"
  ON lumyn_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- lumyn_messages
CREATE POLICY "Users can manage own messages"
  ON lumyn_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- lumyn_user_models
CREATE POLICY "Users can manage own user model"
  ON lumyn_user_models FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- lumyn_claims
CREATE POLICY "Users can manage own claims"
  ON lumyn_claims FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- lumyn_evidence
CREATE POLICY "Users can manage own evidence"
  ON lumyn_evidence FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- lumyn_guiding_principles
CREATE POLICY "Users can manage own guiding principles"
  ON lumyn_guiding_principles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Append-only tables — SELECT + INSERT only for owner
-- No UPDATE, no DELETE via RLS (edge fn uses service role)
-- ─────────────────────────────────────────────

-- lumyn_memory_ops
CREATE POLICY "Users can read own memory ops"
  ON lumyn_memory_ops FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory ops"
  ON lumyn_memory_ops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- lumyn_safety_events
CREATE POLICY "Users can read own safety events"
  ON lumyn_safety_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own safety events"
  ON lumyn_safety_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Append-only + server-update tables
-- SELECT + INSERT for user; UPDATE via service role only
-- ─────────────────────────────────────────────

-- lumyn_patterns
CREATE POLICY "Users can read own patterns"
  ON lumyn_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns"
  ON lumyn_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- lumyn_rate_limits
CREATE POLICY "Users can read own rate limits"
  ON lumyn_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate limits"
  ON lumyn_rate_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);
