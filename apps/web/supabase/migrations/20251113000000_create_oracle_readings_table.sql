-- Five-Number Oracle readings table
-- Stores oracle consultations with 5 numbers and synthesized readings

CREATE TABLE IF NOT EXISTS public.oracle_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- The Five Numbers
    numbers INTEGER[] NOT NULL CHECK (array_length(numbers, 1) = 5),

    -- Capture metadata
    capture_timestamps TIMESTAMP WITH TIME ZONE[] CHECK (array_length(capture_timestamps, 1) = 5),
    capture_methods TEXT[] CHECK (array_length(capture_methods, 1) = 5),
    -- capture_methods values: 'time', 'manual', 'image', 'pattern', 'comment', 'live'

    -- Reduced frequencies (1-9 or master numbers 11, 22, 33)
    core_frequencies INTEGER[] NOT NULL CHECK (array_length(core_frequencies, 1) = 5),

    -- Pattern analysis
    dominant_frequency INTEGER NOT NULL, -- Most prominent number (1-9)
    harmonic_pattern TEXT NOT NULL, -- 'build', 'release', 'amplify', 'balanced', 'focused', 'transition'
    pattern_strength NUMERIC(3,2), -- 0.00 to 1.00 - coherence score

    -- Reading data (structured JSONB)
    reading_data JSONB NOT NULL,
    -- Structure: {
    --   title: string,
    --   numbers: [{number, meaning, element, chakra}],
    --   synthesis: string,
    --   pattern: {type, description},
    --   cta: string,
    --   essenceSentence: string
    -- }

    -- Session metadata
    session_id TEXT, -- For live/interactive captures
    session_type TEXT CHECK (session_type IN ('async', 'live', 'story')),

    -- Engagement metrics
    shared BOOLEAN DEFAULT false,
    saved BOOLEAN DEFAULT true,
    feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),

    -- Privacy & consent
    data_consent_given BOOLEAN DEFAULT false NOT NULL,
    anonymized BOOLEAN DEFAULT true NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Monetization tracking
    reading_tier TEXT DEFAULT 'free' CHECK (reading_tier IN ('free', 'basic', 'premium', 'team')),
    price_aud NUMERIC(10,2)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_oracle_readings_user_id ON public.oracle_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_oracle_readings_created_at ON public.oracle_readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oracle_readings_numbers ON public.oracle_readings USING GIN (numbers);
CREATE INDEX IF NOT EXISTS idx_oracle_readings_pattern ON public.oracle_readings(harmonic_pattern);
CREATE INDEX IF NOT EXISTS idx_oracle_readings_session ON public.oracle_readings(session_id) WHERE session_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.oracle_readings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own oracle readings
CREATE POLICY "Users can view their own oracle readings"
    ON public.oracle_readings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own oracle readings
CREATE POLICY "Users can insert their own oracle readings"
    ON public.oracle_readings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own oracle readings
CREATE POLICY "Users can update their own oracle readings"
    ON public.oracle_readings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own oracle readings
CREATE POLICY "Users can delete their own oracle readings"
    ON public.oracle_readings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to get user's oracle pattern frequency
CREATE OR REPLACE FUNCTION public.get_user_oracle_patterns(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    pattern TEXT,
    count BIGINT,
    avg_strength NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        harmonic_pattern AS pattern,
        COUNT(*) AS count,
        AVG(pattern_strength) AS avg_strength
    FROM public.oracle_readings
    WHERE user_id = user_uuid
    GROUP BY harmonic_pattern
    ORDER BY count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's most frequent oracle numbers
CREATE OR REPLACE FUNCTION public.get_user_oracle_numbers(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    number_value INTEGER,
    frequency BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        unnest(numbers) AS number_value,
        COUNT(*) AS frequency
    FROM public.oracle_readings
    WHERE user_id = user_uuid
    GROUP BY number_value
    ORDER BY frequency DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate oracle reading streak
CREATE OR REPLACE FUNCTION public.get_user_oracle_streak(user_uuid UUID)
RETURNS TABLE (
    current_streak INTEGER,
    longest_streak INTEGER,
    total_readings INTEGER
) AS $$
DECLARE
    current INTEGER := 0;
    longest INTEGER := 0;
    total INTEGER := 0;
    prev_date DATE := NULL;
    reading_date DATE;
BEGIN
    -- Count total readings
    SELECT COUNT(*) INTO total
    FROM public.oracle_readings
    WHERE user_id = user_uuid;

    -- Calculate streaks
    FOR reading_date IN
        SELECT DISTINCT DATE(created_at)
        FROM public.oracle_readings
        WHERE user_id = user_uuid
        ORDER BY DATE(created_at) DESC
    LOOP
        IF prev_date IS NULL THEN
            -- First date, check if it's today or yesterday
            IF reading_date >= CURRENT_DATE - INTERVAL '1 day' THEN
                current := 1;
                longest := 1;
            END IF;
            prev_date := reading_date;
        ELSIF reading_date = prev_date - INTERVAL '1 day' THEN
            -- Consecutive day
            current := current + 1;
            longest := GREATEST(longest, current);
            prev_date := reading_date;
        ELSE
            -- Streak broken, but continue checking for longest
            IF current > 0 THEN
                longest := GREATEST(longest, current);
            END IF;
            current := 0;
            prev_date := reading_date;
        END IF;
    END LOOP;

    -- Check if current streak is still active
    IF prev_date < CURRENT_DATE - INTERVAL '1 day' THEN
        current := 0;
    END IF;

    RETURN QUERY SELECT current, longest, total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_oracle_patterns TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_oracle_numbers TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_oracle_streak TO authenticated;

-- Create anonymized analytics view
CREATE OR REPLACE VIEW public.oracle_pattern_analytics AS
SELECT
    harmonic_pattern,
    reading_tier,
    DATE_TRUNC('day', created_at) AS date,
    COUNT(*) AS reading_count,
    AVG(pattern_strength) AS avg_strength,
    COUNT(CASE WHEN shared = true THEN 1 END) AS share_count,
    AVG(feedback_rating) AS avg_rating
FROM public.oracle_readings
WHERE data_consent_given = true AND anonymized = true
GROUP BY harmonic_pattern, reading_tier, DATE_TRUNC('day', created_at);

-- Grant access to analytics
GRANT SELECT ON public.oracle_pattern_analytics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.oracle_readings IS 'Five-Number Oracle readings with synthesis and pattern analysis';
COMMENT ON COLUMN public.oracle_readings.numbers IS 'Array of 5 numbers (1-99) captured for oracle reading';
COMMENT ON COLUMN public.oracle_readings.core_frequencies IS 'Numerologically reduced values (1-9 or master numbers)';
COMMENT ON COLUMN public.oracle_readings.harmonic_pattern IS 'Pattern type: build/release/amplify/balanced/focused/transition';
COMMENT ON COLUMN public.oracle_readings.pattern_strength IS 'Coherence score from 0.00 (scattered) to 1.00 (perfectly aligned)';
COMMENT ON COLUMN public.oracle_readings.reading_data IS 'Full oracle reading with individual meanings + synthesis';
