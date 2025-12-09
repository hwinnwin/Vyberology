-- Orders table for Stripe payments
-- Stores completed checkout sessions for Luminous Legend Book purchases

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent TEXT,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  order_of_light TEXT NOT NULL,
  dob DATE,
  dedication TEXT,
  quiz_result JSONB,
  amount_total INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'aud',
  status TEXT NOT NULL DEFAULT 'completed',
  pdf_generated BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups by email
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);

-- Index for Stripe session lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (for webhook handler)
CREATE POLICY "Service role full access" ON public.orders
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can view their own orders by email (if authenticated)
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

COMMENT ON TABLE public.orders IS 'Stores Stripe checkout orders for Luminous Legend Book purchases';
