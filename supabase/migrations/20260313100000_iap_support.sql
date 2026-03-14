-- IAP Support: platform tracking, credit ledger, webhook idempotency

-- 1. Track payment platform on purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS platform_transaction_id TEXT;

-- Make stripe_payment_intent_id nullable (IAP purchases have no Stripe intent)
ALTER TABLE purchases ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

-- 2. Credit transaction ledger for per-purchase attribution
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'stripe',
  source_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own credit transactions') THEN
    CREATE POLICY "Users can view own credit transactions"
      ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Idempotency tables for webhook processing
CREATE TABLE IF NOT EXISTS iap_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  payload JSONB
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id)
);
