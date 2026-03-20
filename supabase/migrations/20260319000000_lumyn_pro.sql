-- supabase/migrations/20260319000000_lumyn_pro.sql

-- Add Lumyn Pro entitlement columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS lumyn_pro            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lumyn_pro_until      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lumyn_messages_used  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lumyn_last_message_at TIMESTAMPTZ;

-- Atomic free-message increment
-- Returns new count, or NULL if limit already hit (0 rows updated)
CREATE OR REPLACE FUNCTION lumyn_increment_free_messages(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_new_count INTEGER;
BEGIN
  UPDATE user_profiles
    SET lumyn_messages_used = lumyn_messages_used + 1
    WHERE user_id = p_user_id
      AND lumyn_messages_used < 10
      AND lumyn_pro = false
    RETURNING lumyn_messages_used INTO v_new_count;
  RETURN v_new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION lumyn_increment_free_messages(UUID) TO authenticated;

-- Seed Lumyn Pro product + price
-- Replace placeholder IDs with real Stripe IDs before deploy
INSERT INTO products (stripe_product_id, name, description, active)
VALUES ('prod_lumyn_pro', 'Lumyn Pro', 'Unlimited Lumyn conversations with full memory and all modes', true)
ON CONFLICT (stripe_product_id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO prices (product_id, stripe_price_id, currency, unit_amount, interval, interval_count, active)
VALUES (
  (SELECT id FROM products WHERE stripe_product_id = 'prod_lumyn_pro'),
  'price_lumyn_pro_monthly',
  'usd',
  1497,
  'month',
  1,
  true
)
ON CONFLICT (stripe_price_id) DO UPDATE SET unit_amount = EXCLUDED.unit_amount, active = EXCLUDED.active;
