-- ============================================================================
-- Volume VI: Transmission Layer
-- Migration: API Keys, Webhooks, Rate Limiting, Usage Tracking
-- ============================================================================

-- ============================================================================
-- 1. API KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Key metadata
  name TEXT NOT NULL, -- User-defined name (e.g., "Production App")
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the actual key
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "vybe_1234")

  -- Permissions & scoping
  scopes TEXT[] DEFAULT ARRAY['read'], -- ['read', 'write', 'admin']
  is_active BOOLEAN DEFAULT true,

  -- Rate limiting
  rate_limit_tier TEXT DEFAULT 'free' CHECK (rate_limit_tier IN ('free', 'pro', 'enterprise')),
  requests_per_second INTEGER DEFAULT 10,
  requests_per_month INTEGER,

  -- Usage stats (denormalized for quick access)
  total_requests BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Lifecycle
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiry
  revoked_at TIMESTAMPTZ
);

CREATE INDEX api_keys_user_id_idx ON public.api_keys(user_id);
CREATE INDEX api_keys_key_hash_idx ON public.api_keys(key_hash);
CREATE INDEX api_keys_active_idx ON public.api_keys(is_active) WHERE is_active = true;

-- RLS for api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_owner" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. WEBHOOKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Webhook metadata
  url TEXT NOT NULL, -- Target endpoint
  secret TEXT NOT NULL, -- For HMAC signature verification
  is_active BOOLEAN DEFAULT true,

  -- Event subscriptions
  events TEXT[] NOT NULL, -- ['reading.created', 'export.ready', 'tag.attached']

  -- Retry configuration
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60, -- Exponential backoff base

  -- Stats
  total_deliveries BIGINT DEFAULT 0,
  failed_deliveries BIGINT DEFAULT 0,
  last_delivered_at TIMESTAMPTZ,

  -- Lifecycle
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX webhooks_user_id_idx ON public.webhooks(user_id);
CREATE INDEX webhooks_active_idx ON public.webhooks(is_active) WHERE is_active = true;

-- RLS for webhooks
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_owner" ON public.webhooks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. WEBHOOK DELIVERIES TABLE (Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,

  -- Delivery details
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Request details
  http_status INTEGER,
  request_headers JSONB,
  response_body TEXT,
  response_headers JSONB,

  -- Timing
  attempt_number INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms INTEGER,

  -- Outcome
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
  error_message TEXT
);

CREATE INDEX webhook_deliveries_webhook_id_idx ON public.webhook_deliveries(webhook_id);
CREATE INDEX webhook_deliveries_delivered_at_idx ON public.webhook_deliveries(delivered_at DESC);
CREATE INDEX webhook_deliveries_status_idx ON public.webhook_deliveries(status);

-- RLS for webhook_deliveries (via webhook ownership)
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_owner" ON public.webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.webhooks w
      WHERE w.id = webhook_id AND w.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. USAGE LOGS TABLE (Rate Limiting & Billing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,

  -- Request details
  endpoint TEXT NOT NULL, -- e.g., "POST /v1/read"
  method TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,

  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,

  -- Billing
  tokens_used INTEGER, -- For AI-powered endpoints
  credits_consumed NUMERIC(10, 4), -- For marketplace transactions

  -- Timestamp (partitionable for time-series)
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX usage_logs_api_key_id_idx ON public.usage_logs(api_key_id);
CREATE INDEX usage_logs_logged_at_idx ON public.usage_logs(logged_at DESC);

-- Composite index for rate limiting queries (last N seconds)
CREATE INDEX usage_logs_rate_limit_idx ON public.usage_logs(api_key_id, logged_at DESC);

-- RLS for usage_logs (via api_key ownership)
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_logs_owner" ON public.usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.api_keys ak
      WHERE ak.id = api_key_id AND ak.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. RATE LIMIT BUCKETS (Token Bucket Algorithm)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  api_key_id UUID PRIMARY KEY REFERENCES public.api_keys(id) ON DELETE CASCADE,

  -- Token bucket state
  tokens_remaining INTEGER NOT NULL,
  tokens_max INTEGER NOT NULL, -- Burst capacity
  refill_rate INTEGER NOT NULL, -- Tokens per second

  -- Timing
  last_refill_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month')
);

CREATE INDEX rate_limit_buckets_reset_idx ON public.rate_limit_buckets(window_reset_at);

-- RLS for rate_limit_buckets (read-only for key owners)
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limit_buckets_owner" ON public.rate_limit_buckets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.api_keys ak
      WHERE ak.id = api_key_id AND ak.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Generate API key prefix (for display)
CREATE OR REPLACE FUNCTION generate_api_key_prefix()
RETURNS TEXT AS $$
BEGIN
  RETURN 'vybe_' || substring(md5(random()::text) from 1 for 8);
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Check rate limit for API key
CREATE OR REPLACE FUNCTION check_rate_limit(p_api_key_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_bucket RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_elapsed_seconds NUMERIC;
  v_tokens_to_add INTEGER;
BEGIN
  -- Get current bucket state
  SELECT * INTO v_bucket
  FROM public.rate_limit_buckets
  WHERE api_key_id = p_api_key_id;

  IF NOT FOUND THEN
    RETURN FALSE; -- No bucket = rate limit exceeded
  END IF;

  -- Calculate elapsed time since last refill
  v_elapsed_seconds := EXTRACT(EPOCH FROM (v_now - v_bucket.last_refill_at));

  -- Add tokens based on refill rate
  v_tokens_to_add := FLOOR(v_elapsed_seconds * v_bucket.refill_rate);

  IF v_tokens_to_add > 0 THEN
    -- Refill bucket (capped at max)
    UPDATE public.rate_limit_buckets
    SET tokens_remaining = LEAST(tokens_max, tokens_remaining + v_tokens_to_add),
        last_refill_at = v_now
    WHERE api_key_id = p_api_key_id;
  END IF;

  -- Check if tokens available
  IF v_bucket.tokens_remaining + v_tokens_to_add > 0 THEN
    -- Consume 1 token
    UPDATE public.rate_limit_buckets
    SET tokens_remaining = tokens_remaining - 1
    WHERE api_key_id = p_api_key_id;

    RETURN TRUE;
  ELSE
    RETURN FALSE; -- Rate limit exceeded
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Log usage (called after each API request)
CREATE OR REPLACE FUNCTION log_usage(
  p_api_key_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert usage log
  INSERT INTO public.usage_logs (
    api_key_id,
    endpoint,
    method,
    status_code,
    response_time_ms,
    ip_address,
    user_agent,
    logged_at
  ) VALUES (
    p_api_key_id,
    p_endpoint,
    p_method,
    p_status_code,
    p_response_time_ms,
    p_ip_address,
    p_user_agent,
    NOW()
  );

  -- Update API key stats
  UPDATE public.api_keys
  SET total_requests = total_requests + 1,
      last_used_at = NOW()
  WHERE id = p_api_key_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Auto-create rate limit bucket on API key insert
CREATE OR REPLACE FUNCTION create_rate_limit_bucket()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.rate_limit_buckets (
    api_key_id,
    tokens_remaining,
    tokens_max,
    refill_rate,
    last_refill_at,
    window_reset_at
  ) VALUES (
    NEW.id,
    NEW.requests_per_second, -- Start with full bucket
    NEW.requests_per_second * 2, -- Burst = 2x sustained rate
    NEW.requests_per_second,
    NOW(),
    NOW() + INTERVAL '1 month'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_keys_create_bucket
  AFTER INSERT ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION create_rate_limit_bucket();

-- ============================================================================
-- 8. VIEWS
-- ============================================================================

-- API key usage summary (for dashboard)
CREATE OR REPLACE VIEW v_api_key_usage AS
SELECT
  ak.id AS api_key_id,
  ak.user_id,
  ak.name AS key_name,
  ak.key_prefix,
  ak.rate_limit_tier,
  ak.is_active,

  -- Usage stats
  ak.total_requests,
  ak.last_used_at,

  -- Current period stats (last 30 days)
  COUNT(ul.id) FILTER (WHERE ul.logged_at >= NOW() - INTERVAL '30 days') AS requests_last_30d,
  AVG(ul.response_time_ms) FILTER (WHERE ul.logged_at >= NOW() - INTERVAL '30 days') AS avg_response_time_ms,

  -- Rate limit status
  rlb.tokens_remaining,
  rlb.tokens_max,
  rlb.window_reset_at,

  ak.created_at,
  ak.expires_at
FROM public.api_keys ak
LEFT JOIN public.usage_logs ul ON ul.api_key_id = ak.id
LEFT JOIN public.rate_limit_buckets rlb ON rlb.api_key_id = ak.id
GROUP BY ak.id, rlb.tokens_remaining, rlb.tokens_max, rlb.window_reset_at;

-- Webhook delivery stats (for dashboard)
CREATE OR REPLACE VIEW v_webhook_stats AS
SELECT
  w.id AS webhook_id,
  w.user_id,
  w.url,
  w.is_active,
  w.events,

  -- Delivery stats
  w.total_deliveries,
  w.failed_deliveries,
  ROUND(100.0 * w.failed_deliveries / NULLIF(w.total_deliveries, 0), 2) AS failure_rate_pct,
  w.last_delivered_at,

  -- Recent delivery stats (last 24 hours)
  COUNT(wd.id) FILTER (WHERE wd.delivered_at >= NOW() - INTERVAL '24 hours') AS deliveries_last_24h,
  COUNT(wd.id) FILTER (WHERE wd.delivered_at >= NOW() - INTERVAL '24 hours' AND wd.status = 'failed') AS failures_last_24h,

  w.created_at,
  w.updated_at
FROM public.webhooks w
LEFT JOIN public.webhook_deliveries wd ON wd.webhook_id = w.id
GROUP BY w.id;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration creates the foundation for Volume VI (Transmission Layer):
--
-- 1. API Keys: Scoped credentials for external integrations
-- 2. Webhooks: Event-driven notifications with retry logic
-- 3. Usage Logs: Billing-ready telemetry and request auditing
-- 4. Rate Limiting: Token bucket algorithm for fair usage
--
-- To use:
-- 1. Run this migration in your Supabase/PostgreSQL database
-- 2. Create an API key via POST /v1/keys (implemented in Phase 4 code)
-- 3. Use the key in Authorization: Bearer vybe_xxxxxxxx header
-- 4. Configure webhooks via POST /v1/webhooks
-- 5. Monitor usage via GET /v1/keys/:id/usage
--
-- Security notes:
-- - Never store raw API keys (only SHA-256 hashes)
-- - Webhook secrets should be UUID v4 (for HMAC signatures)
-- - RLS enforces user ownership of all resources
-- - Rate limits prevent abuse (10 req/s free, 100 req/s pro)
-- ============================================================================
