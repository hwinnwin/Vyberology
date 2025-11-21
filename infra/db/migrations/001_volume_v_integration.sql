-- ============================================================================
-- Volume V: Integration Layer
-- Migration: Notes, Tags, Exports, Analytics
-- ============================================================================

-- ============================================================================
-- 1. NOTES TABLE (Journaling)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_id UUID REFERENCES public.readings(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX notes_user_id_idx ON public.notes(user_id);
CREATE INDEX notes_reading_id_idx ON public.notes(reading_id);
CREATE INDEX notes_created_at_idx ON public.notes(created_at DESC);

-- RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_owner" ON public.notes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. TAGS TABLES (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX tags_user_id_idx ON public.tags(user_id);
CREATE INDEX tags_name_idx ON public.tags(name);

-- RLS for tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_owner" ON public.tags
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reading-Tag junction table
CREATE TABLE IF NOT EXISTS public.reading_tags (
  reading_id UUID NOT NULL REFERENCES public.readings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (reading_id, tag_id)
);

CREATE INDEX reading_tags_reading_idx ON public.reading_tags(reading_id);
CREATE INDEX reading_tags_tag_idx ON public.reading_tags(tag_id);

-- RLS for reading_tags
ALTER TABLE public.reading_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reading_tags_owner" ON public.reading_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.readings r
      WHERE r.id = reading_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.readings r
      WHERE r.id = reading_id AND r.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. EXPORTS TABLE (Background Jobs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('csv', 'json')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'ready', 'failed')) DEFAULT 'queued',
  url TEXT,
  params JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX exports_user_id_idx ON public.exports(user_id);
CREATE INDEX exports_status_idx ON public.exports(status);
CREATE INDEX exports_created_at_idx ON public.exports(created_at DESC);

-- RLS for exports
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exports_owner" ON public.exports
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER exports_updated_at
  BEFORE UPDATE ON public.exports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ANALYTICS VIEWS (Fast Reads)
-- ============================================================================

-- Elements over time
CREATE OR REPLACE VIEW public.v_elements_daily AS
SELECT
  user_id,
  DATE_TRUNC('day', created_at) AS day,
  jsonb_array_elements_text(engine->'elements') AS element,
  COUNT(*) AS count
FROM public.readings
GROUP BY user_id, day, element;

-- Chakras over time
CREATE OR REPLACE VIEW public.v_chakras_daily AS
SELECT
  user_id,
  DATE_TRUNC('day', created_at) AS day,
  jsonb_array_elements_text(engine->'chakras') AS chakra,
  COUNT(*) AS count
FROM public.readings
GROUP BY user_id, day, chakra;

-- Reading summary view (for history queries)
CREATE OR REPLACE VIEW public.v_readings_summary AS
SELECT
  r.id,
  r.user_id,
  r.created_at,
  r.volume,
  r.engine->'sums'->>'reduced' AS reduced_number,
  r.engine->'sums'->>'master' AS master_number,
  r.engine->'elements' AS elements,
  r.engine->'chakras' AS chakras,
  r.composed->>'markerTitle' AS marker_title,
  r.composed->>'essence' AS essence,
  COALESCE(
    (
      SELECT jsonb_agg(t.name)
      FROM public.reading_tags rt
      JOIN public.tags t ON t.id = rt.tag_id
      WHERE rt.reading_id = r.id
    ),
    '[]'::jsonb
  ) AS tags,
  (
    SELECT COUNT(*)
    FROM public.notes n
    WHERE n.reading_id = r.id
  ) AS notes_count
FROM public.readings r;

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Search readings by text content
CREATE OR REPLACE FUNCTION search_readings(
  p_user_id UUID,
  p_query TEXT
) RETURNS SETOF public.readings AS $$
BEGIN
  RETURN QUERY
  SELECT r.*
  FROM public.readings r
  WHERE r.user_id = p_user_id
    AND (
      r.input::text ILIKE '%' || p_query || '%'
      OR r.composed::text ILIKE '%' || p_query || '%'
    )
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get reading with full context (notes + tags)
CREATE OR REPLACE FUNCTION get_reading_with_context(p_reading_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'reading', row_to_json(r.*),
    'notes', (
      SELECT COALESCE(json_agg(n.*), '[]'::json)
      FROM public.notes n
      WHERE n.reading_id = p_reading_id
    ),
    'tags', (
      SELECT COALESCE(json_agg(t.*), '[]'::json)
      FROM public.reading_tags rt
      JOIN public.tags t ON t.id = rt.tag_id
      WHERE rt.reading_id = p_reading_id
    )
  ) INTO result
  FROM public.readings r
  WHERE r.id = p_reading_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETE
-- ============================================================================

COMMENT ON TABLE public.notes IS 'User journal notes attached to readings';
COMMENT ON TABLE public.tags IS 'User-defined tags for organizing readings';
COMMENT ON TABLE public.reading_tags IS 'Many-to-many relationship between readings and tags';
COMMENT ON TABLE public.exports IS 'Background export jobs for CSV/JSON generation';
COMMENT ON VIEW public.v_elements_daily IS 'Daily element distribution per user';
COMMENT ON VIEW public.v_chakras_daily IS 'Daily chakra distribution per user';
COMMENT ON VIEW public.v_readings_summary IS 'Optimized view for history queries with tags and notes count';
