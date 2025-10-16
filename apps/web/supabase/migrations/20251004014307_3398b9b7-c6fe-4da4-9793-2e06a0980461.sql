-- Create readings table for storing user's numerology codex entries
CREATE TABLE IF NOT EXISTS public.readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  normalized_number TEXT NOT NULL,
  numerology_data JSONB NOT NULL,
  chakra_data JSONB NOT NULL,
  context TEXT,
  tags TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see their own readings
CREATE POLICY "Users can view their own readings"
  ON public.readings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own readings"
  ON public.readings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own readings"
  ON public.readings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own readings"
  ON public.readings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_readings_user_id ON public.readings(user_id);
CREATE INDEX idx_readings_created_at ON public.readings(created_at DESC);
CREATE INDEX idx_readings_tags ON public.readings USING GIN(tags);