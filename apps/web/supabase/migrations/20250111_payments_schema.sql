-- Payments Schema for Vyberology
-- Created: 2025-01-11
-- Purpose: Enable Stripe payment processing and subscription management

-- Products table (reading tiers)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prices table (pricing for products)
CREATE TABLE IF NOT EXISTS prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stripe_price_id TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  currency TEXT NOT NULL DEFAULT 'usd',
  unit_amount INTEGER NOT NULL, -- amount in cents
  interval TEXT, -- null for one-time, 'month' or 'year' for subscriptions
  interval_count INTEGER DEFAULT 1,
  trial_period_days INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table (links users to Stripe customers)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table (active subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, canceled, past_due, etc.
  price_id UUID REFERENCES prices(id),
  quantity INTEGER DEFAULT 1,
  cancel_at_period_end BOOLEAN DEFAULT false,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table (one-time payments)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL, -- amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- succeeded, pending, failed, etc.
  product_id UUID REFERENCES products(id),
  price_id UUID REFERENCES prices(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading credits table (track user credits)
CREATE TABLE IF NOT EXISTS reading_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  last_credit_purchase TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_active ON prices(active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_reading_credits_user_id ON reading_credits(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_credits ENABLE ROW LEVEL SECURITY;

-- Products: everyone can read active products
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (active = true);

-- Prices: everyone can read active prices
CREATE POLICY "Prices are viewable by everyone" ON prices
  FOR SELECT USING (active = true);

-- Customers: users can only see their own customer record
CREATE POLICY "Users can view own customer data" ON customers
  FOR SELECT USING (auth.uid() = id);

-- Subscriptions: users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Purchases: users can only see their own purchases
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Reading credits: users can only see their own credits
CREATE POLICY "Users can view own reading credits" ON reading_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION add_reading_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_purchase_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO reading_credits (user_id, credits, total_purchased, last_credit_purchase)
  VALUES (p_user_id, p_credits, p_credits, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    credits = reading_credits.credits + p_credits,
    total_purchased = reading_credits.total_purchased + p_credits,
    last_credit_purchase = NOW(),
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION use_reading_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  -- Check if user has credits
  SELECT credits INTO v_credits
  FROM reading_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_credits IS NULL OR v_credits <= 0 THEN
    RETURN false;
  END IF;

  -- Deduct one credit
  UPDATE reading_credits
  SET
    credits = credits - 1,
    total_used = total_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT credits INTO v_credits
  FROM reading_credits
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_credits, 0);
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_credits_updated_at BEFORE UPDATE ON reading_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial products and prices
-- You can customize these based on your pricing strategy

INSERT INTO products (stripe_product_id, name, description, active) VALUES
  ('prod_lite', 'Lite Reading', 'Quick numerology reading with basic insights', true),
  ('prod_standard', 'Standard Reading', 'Comprehensive numerology reading with detailed analysis', true),
  ('prod_deep', 'Deep Reading', 'In-depth numerology reading with full AI interpretation', true),
  ('prod_credits_5', '5 Reading Credits', 'Pack of 5 reading credits', true),
  ('prod_credits_10', '10 Reading Credits', 'Pack of 10 reading credits (Best Value)', true),
  ('prod_credits_25', '25 Reading Credits', 'Pack of 25 reading credits (Premium)', true)
ON CONFLICT (stripe_product_id) DO NOTHING;

-- Add corresponding prices (amounts in cents)
-- Note: You'll need to update these with actual Stripe price IDs after creating them in Stripe dashboard

-- Individual readings (one-time payments)
INSERT INTO prices (product_id, stripe_price_id, currency, unit_amount, interval) VALUES
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_lite'), 'price_lite', 'usd', 997, null),
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_standard'), 'price_standard', 'usd', 1997, null),
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_deep'), 'price_deep', 'usd', 3997, null),
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_credits_5'), 'price_credits_5', 'usd', 4997, null),
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_credits_10'), 'price_credits_10', 'usd', 8997, null),
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_credits_25'), 'price_credits_25', 'usd', 19997, null)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON prices TO anon, authenticated;
GRANT SELECT ON customers TO authenticated;
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON purchases TO authenticated;
GRANT SELECT ON reading_credits TO authenticated;
