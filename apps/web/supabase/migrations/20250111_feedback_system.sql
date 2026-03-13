-- Feedback System for Vyberology
-- Created: 2025-01-11
-- Purpose: Allow users to submit bug reports and feature requests

-- Feedback types enum
CREATE TYPE feedback_type AS ENUM ('bug', 'feature', 'improvement', 'other');

-- Feedback status enum
CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'completed', 'wont_fix', 'duplicate');

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type feedback_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status feedback_status DEFAULT 'new',

  -- User context
  email TEXT,
  user_agent TEXT,
  page_url TEXT,

  -- System context
  app_version TEXT,
  browser_info JSONB,

  -- Admin notes
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Anyone can insert feedback (even anonymous users)
CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Users can update their own feedback (within 24 hours)
CREATE POLICY "Users can update own recent feedback" ON feedback
  FOR UPDATE USING (
    auth.uid() = user_id AND
    created_at > NOW() - INTERVAL '24 hours'
  );

-- Trigger to update updated_at
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get feedback stats (for admin dashboard)
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS TABLE (
  total_feedback BIGINT,
  bugs BIGINT,
  features BIGINT,
  improvements BIGINT,
  new_items BIGINT,
  in_progress_items BIGINT,
  completed_items BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_feedback,
    COUNT(*) FILTER (WHERE type = 'bug')::BIGINT as bugs,
    COUNT(*) FILTER (WHERE type = 'feature')::BIGINT as features,
    COUNT(*) FILTER (WHERE type = 'improvement')::BIGINT as improvements,
    COUNT(*) FILTER (WHERE status = 'new')::BIGINT as new_items,
    COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress_items,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_items
  FROM feedback;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT ON feedback TO anon, authenticated;
GRANT SELECT ON feedback TO authenticated;
