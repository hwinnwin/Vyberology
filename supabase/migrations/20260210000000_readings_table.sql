-- Drop and recreate readings table (safe: table was just created and is empty)
DROP TABLE IF EXISTS readings CASCADE;

-- Readings table: persists generated readings server-side
CREATE TABLE readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'lyf-path', 'full-vybe')),
  full_name TEXT NOT NULL,
  dob DATE NOT NULL,
  numerology_numbers JSONB NOT NULL DEFAULT '{}'::jsonb,
  semantics JSONB,
  reading_text TEXT,
  reading_data JSONB DEFAULT '{}'::jsonb,
  share_slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_readings_user_id ON readings(user_id);
CREATE INDEX idx_readings_share_slug ON readings(share_slug);
CREATE INDEX idx_readings_tier ON readings(tier);
CREATE INDEX idx_readings_created_at ON readings(created_at DESC);

-- RLS
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own readings"
  ON readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shared readings"
  ON readings FOR SELECT
  USING (share_slug IS NOT NULL);

CREATE POLICY "Users can insert own readings"
  ON readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER update_readings_updated_at
  BEFORE UPDATE ON readings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT ON readings TO authenticated;
GRANT SELECT ON readings TO anon;

-- Function to save a reading
CREATE OR REPLACE FUNCTION save_reading(
  p_user_id UUID,
  p_purchase_id UUID DEFAULT NULL,
  p_tier TEXT DEFAULT 'free',
  p_full_name TEXT DEFAULT '',
  p_dob DATE DEFAULT CURRENT_DATE,
  p_numerology_numbers JSONB DEFAULT '{}'::jsonb,
  p_semantics JSONB DEFAULT NULL,
  p_reading_text TEXT DEFAULT NULL,
  p_reading_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
  v_slug TEXT;
BEGIN
  v_slug := substr(md5(random()::text || clock_timestamp()::text), 1, 8);

  INSERT INTO readings (
    user_id, purchase_id, tier, full_name, dob,
    numerology_numbers, semantics, reading_text, reading_data, share_slug
  ) VALUES (
    p_user_id, p_purchase_id, p_tier, p_full_name, p_dob,
    p_numerology_numbers, p_semantics, p_reading_text, p_reading_data, v_slug
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'share_slug', v_slug);
END;
$$;

-- Function to get a reading by share slug
CREATE OR REPLACE FUNCTION get_reading_by_slug(p_slug TEXT)
RETURNS SETOF readings LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM readings WHERE share_slug = p_slug LIMIT 1;
END;
$$;
