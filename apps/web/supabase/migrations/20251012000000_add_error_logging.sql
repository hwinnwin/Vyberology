-- Create error logs table for debugging
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  request_data JSONB,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function calls log table for monitoring
CREATE TABLE IF NOT EXISTS public.function_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  duration_ms INTEGER,
  request_size INTEGER,
  response_size INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.function_calls ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert logs (for debugging)
CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert function call logs"
  ON public.function_calls FOR INSERT
  WITH CHECK (true);

-- Only allow viewing logs in development (you can restrict this later)
CREATE POLICY "Anyone can view error logs"
  ON public.error_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view function call logs"
  ON public.function_calls FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_error_logs_function ON public.error_logs(function_name);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_function_calls_function ON public.function_calls(function_name);
CREATE INDEX idx_function_calls_created_at ON public.function_calls(created_at DESC);
