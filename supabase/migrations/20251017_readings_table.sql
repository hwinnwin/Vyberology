-- added by Claude Code (Stage B - IP Protection)
-- Readings table with Row Level Security for V4 generated readings

-- Create readings table
CREATE TABLE IF NOT EXISTS public.readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Input data
  raw_input TEXT NOT NULL,
  context TEXT,
  entry_no INTEGER,

  -- Generated reading (stored as JSONB for flexibility)
  reading_data JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT readings_user_id_created_at_idx UNIQUE (user_id, created_at)
);

-- Create index for efficient user queries
CREATE INDEX IF NOT EXISTS readings_user_id_idx ON public.readings(user_id);
CREATE INDEX IF NOT EXISTS readings_created_at_idx ON public.readings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view only their own readings
CREATE POLICY "Users can view own readings"
  ON public.readings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own readings
CREATE POLICY "Users can insert own readings"
  ON public.readings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own readings (e.g., add notes)
CREATE POLICY "Users can update own readings"
  ON public.readings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own readings
CREATE POLICY "Users can delete own readings"
  ON public.readings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypasses RLS (for Edge Function inserts)
-- No explicit policy needed - service role has superuser privileges

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER readings_updated_at
  BEFORE UPDATE ON public.readings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.readings IS 'Stores V4 deterministic readings generated server-side to protect IP';
COMMENT ON COLUMN public.readings.reading_data IS 'Full reading JSON from @vybe/reading-core-private';
COMMENT ON COLUMN public.readings.entry_no IS 'Optional Cycle IV entry number for sequencing';
