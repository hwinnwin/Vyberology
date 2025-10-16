-- Create user_readings table for opt-in cloud storage
-- This allows users to back up their readings and participate in data collection

CREATE TABLE IF NOT EXISTS public.user_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Reading data
    input_type TEXT NOT NULL CHECK (input_type IN ('time', 'pattern', 'manual', 'image')),
    input_value TEXT NOT NULL,
    reading_text TEXT NOT NULL,
    numbers TEXT[], -- Array of extracted numbers

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    device_id TEXT, -- Optional device identifier

    -- Privacy & consent
    data_consent_given BOOLEAN DEFAULT false NOT NULL,
    anonymized BOOLEAN DEFAULT true NOT NULL,

    -- Analytics (anonymized)
    reading_category TEXT, -- e.g., "angel_number", "time_capture", "custom"
    frequency_count INTEGER DEFAULT 1
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_readings_user_id ON public.user_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_readings_created_at ON public.user_readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_readings_input_type ON public.user_readings(input_type);
CREATE INDEX IF NOT EXISTS idx_user_readings_numbers ON public.user_readings USING GIN (numbers);

-- Enable Row Level Security
ALTER TABLE public.user_readings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own readings
CREATE POLICY "Users can view their own readings"
    ON public.user_readings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own readings
CREATE POLICY "Users can insert their own readings"
    ON public.user_readings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own readings
CREATE POLICY "Users can update their own readings"
    ON public.user_readings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own readings
CREATE POLICY "Users can delete their own readings"
    ON public.user_readings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a view for anonymized analytics (for admins/researchers)
CREATE OR REPLACE VIEW public.anonymized_reading_stats AS
SELECT
    input_type,
    unnest(numbers) AS number_pattern,
    COUNT(*) AS frequency,
    DATE_TRUNC('day', created_at) AS date
FROM public.user_readings
WHERE data_consent_given = true AND anonymized = true
GROUP BY input_type, number_pattern, DATE_TRUNC('day', created_at);

-- Grant access to anonymized stats for authenticated users (optional)
GRANT SELECT ON public.anonymized_reading_stats TO authenticated;

-- Function to get user's most frequent patterns
CREATE OR REPLACE FUNCTION public.get_user_frequent_patterns(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    pattern TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        unnest(numbers) AS pattern,
        COUNT(*) AS count
    FROM public.user_readings
    WHERE user_id = user_uuid
    GROUP BY pattern
    ORDER BY count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync local readings to cloud
CREATE OR REPLACE FUNCTION public.bulk_sync_readings(
    readings_json JSONB,
    user_uuid UUID,
    consent_given BOOLEAN DEFAULT true
)
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
    reading_item JSONB;
BEGIN
    -- Insert each reading from the JSON array
    FOR reading_item IN SELECT * FROM jsonb_array_elements(readings_json)
    LOOP
        INSERT INTO public.user_readings (
            user_id,
            input_type,
            input_value,
            reading_text,
            numbers,
            data_consent_given,
            created_at
        ) VALUES (
            user_uuid,
            (reading_item->>'inputType')::TEXT,
            (reading_item->>'inputValue')::TEXT,
            (reading_item->>'reading')::TEXT,
            ARRAY(SELECT jsonb_array_elements_text(COALESCE(reading_item->'numbers', '[]'::jsonb))),
            consent_given,
            COALESCE((reading_item->>'timestamp')::TIMESTAMP WITH TIME ZONE, NOW())
        )
        ON CONFLICT DO NOTHING;

        inserted_count := inserted_count + 1;
    END LOOP;

    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION public.get_user_frequent_patterns TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_sync_readings TO authenticated;
