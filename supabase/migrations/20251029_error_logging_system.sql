-- ============================================================================
-- Advanced Error Logging & Feedback System
-- ============================================================================
-- Created: 2025-10-29
-- Purpose: Track errors, user feedback, and recovery metrics
-- ============================================================================

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identifiers
  error_id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Error Classification
  category TEXT NOT NULL CHECK (category IN (
    'network', 'database', 'authentication', 'validation',
    'permission', 'performance', 'ui', 'business_logic',
    'third_party', 'unknown'
  )),
  severity TEXT NOT NULL CHECK (severity IN (
    'critical', 'error', 'warning', 'info'
  )),

  -- Error Details
  component TEXT,
  action TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,

  -- Context
  route TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  network_status TEXT CHECK (network_status IN ('online', 'offline', 'slow')),
  viewport JSONB,

  -- Performance Metrics
  memory_usage BIGINT,
  page_load_time INTEGER,
  api_latency INTEGER,
  time_on_page INTEGER,

  -- User Journey
  recent_actions JSONB,

  -- Recovery
  recovery_attempted BOOLEAN DEFAULT FALSE,
  recovered BOOLEAN DEFAULT FALSE,

  -- User Feedback
  user_feedback_helpful BOOLEAN,
  user_feedback_message TEXT,
  user_feedback_timestamp TIMESTAMPTZ,

  -- Additional Data
  metadata JSONB,

  -- Indexes
  INDEX idx_error_logs_timestamp (timestamp DESC),
  INDEX idx_error_logs_session (session_id),
  INDEX idx_error_logs_user (user_id),
  INDEX idx_error_logs_category (category),
  INDEX idx_error_logs_severity (severity),
  INDEX idx_error_logs_component (component),
  INDEX idx_error_logs_created_at (created_at DESC)
);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow inserting errors (anyone can log errors)
CREATE POLICY "Anyone can insert error logs"
  ON error_logs
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own errors
CREATE POLICY "Users can view own error logs"
  ON error_logs
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own error feedback
CREATE POLICY "Users can update own error feedback"
  ON error_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      user_feedback_helpful IS NOT NULL
      OR user_feedback_message IS NOT NULL
    )
  );

-- Admins can view all errors (add admin role check later)
CREATE POLICY "Service role can view all error logs"
  ON error_logs
  FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- Error Analytics Function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_error_analytics(
  time_range TEXT DEFAULT '24h',
  p_session_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Calculate start time based on range
  start_time := CASE time_range
    WHEN '1h' THEN NOW() - INTERVAL '1 hour'
    WHEN '24h' THEN NOW() - INTERVAL '24 hours'
    WHEN '7d' THEN NOW() - INTERVAL '7 days'
    WHEN '30d' THEN NOW() - INTERVAL '30 days'
    ELSE NOW() - INTERVAL '24 hours'
  END;

  -- Build result
  SELECT jsonb_build_object(
    'total_errors', (
      SELECT COUNT(*)
      FROM error_logs
      WHERE timestamp >= start_time
        AND (p_session_id IS NULL OR session_id = p_session_id)
        AND (p_user_id IS NULL OR user_id = p_user_id)
    ),
    'by_category', (
      SELECT jsonb_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*) as count
        FROM error_logs
        WHERE timestamp >= start_time
          AND (p_session_id IS NULL OR session_id = p_session_id)
          AND (p_user_id IS NULL OR user_id = p_user_id)
        GROUP BY category
      ) cat
    ),
    'by_severity', (
      SELECT jsonb_object_agg(severity, count)
      FROM (
        SELECT severity, COUNT(*) as count
        FROM error_logs
        WHERE timestamp >= start_time
          AND (p_session_id IS NULL OR session_id = p_session_id)
          AND (p_user_id IS NULL OR user_id = p_user_id)
        GROUP BY severity
      ) sev
    ),
    'top_components', (
      SELECT jsonb_agg(jsonb_build_object('component', component, 'count', count))
      FROM (
        SELECT component, COUNT(*) as count
        FROM error_logs
        WHERE timestamp >= start_time
          AND component IS NOT NULL
          AND (p_session_id IS NULL OR session_id = p_session_id)
          AND (p_user_id IS NULL OR user_id = p_user_id)
        GROUP BY component
        ORDER BY count DESC
        LIMIT 10
      ) top
    ),
    'recovery_rate', (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(*) FILTER (WHERE recovered = true)::NUMERIC / COUNT(*)) * 100, 2)
      END
      FROM error_logs
      WHERE timestamp >= start_time
        AND recovery_attempted = true
        AND (p_session_id IS NULL OR session_id = p_session_id)
        AND (p_user_id IS NULL OR user_id = p_user_id)
    ),
    'feedback_helpful_rate', (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(*) FILTER (WHERE user_feedback_helpful = true)::NUMERIC / COUNT(*)) * 100, 2)
      END
      FROM error_logs
      WHERE timestamp >= start_time
        AND user_feedback_helpful IS NOT NULL
        AND (p_session_id IS NULL OR session_id = p_session_id)
        AND (p_user_id IS NULL OR user_id = p_user_id)
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- Error Trends Function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_error_trends(
  time_range TEXT DEFAULT '24h',
  interval_bucket TEXT DEFAULT '1 hour'
)
RETURNS TABLE(
  bucket TIMESTAMPTZ,
  total_errors BIGINT,
  critical_errors BIGINT,
  recovered_errors BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time TIMESTAMPTZ;
BEGIN
  -- Calculate start time
  start_time := CASE time_range
    WHEN '1h' THEN NOW() - INTERVAL '1 hour'
    WHEN '24h' THEN NOW() - INTERVAL '24 hours'
    WHEN '7d' THEN NOW() - INTERVAL '7 days'
    WHEN '30d' THEN NOW() - INTERVAL '30 days'
    ELSE NOW() - INTERVAL '24 hours'
  END;

  RETURN QUERY
  SELECT
    time_bucket(interval_bucket::INTERVAL, timestamp) as bucket,
    COUNT(*)::BIGINT as total_errors,
    COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT as critical_errors,
    COUNT(*) FILTER (WHERE recovered = true)::BIGINT as recovered_errors
  FROM error_logs
  WHERE timestamp >= start_time
  GROUP BY bucket
  ORDER BY bucket DESC;
END;
$$;

-- ============================================================================
-- Cleanup Old Errors (Optional - run periodically)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_error_logs(
  retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM error_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_error_log_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER error_logs_updated_at
  BEFORE UPDATE ON error_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_error_log_timestamp();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE error_logs IS 'Advanced error logging with user feedback and recovery tracking';
COMMENT ON COLUMN error_logs.error_id IS 'Unique identifier for this error instance';
COMMENT ON COLUMN error_logs.session_id IS 'User session identifier for journey tracking';
COMMENT ON COLUMN error_logs.category IS 'Error category for classification';
COMMENT ON COLUMN error_logs.severity IS 'Error severity level';
COMMENT ON COLUMN error_logs.recent_actions IS 'Last 10 user actions before error';
COMMENT ON COLUMN error_logs.recovery_attempted IS 'Whether automatic recovery was attempted';
COMMENT ON COLUMN error_logs.recovered IS 'Whether recovery was successful';
COMMENT ON COLUMN error_logs.user_feedback_helpful IS 'User feedback on error handling';

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Allow anon users to insert errors
GRANT INSERT ON error_logs TO anon;
GRANT INSERT ON error_logs TO authenticated;

-- Allow authenticated users to select/update their own errors
GRANT SELECT, UPDATE ON error_logs TO authenticated;

-- ============================================================================
-- Initial Data (Optional - for testing)
-- ============================================================================

-- Example: Insert a test error log (remove in production)
-- INSERT INTO error_logs (
--   error_id, session_id, category, severity,
--   component, action, error_message,
--   route, user_agent, network_status
-- ) VALUES (
--   'test_error_001', 'test_session', 'network', 'warning',
--   'GetVybe', 'generate_reading', 'Failed to fetch reading',
--   '/get-vybe', 'Mozilla/5.0...', 'online'
-- );
