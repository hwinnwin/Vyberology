-- Refund a reading credit (reverses use_reading_credit)
-- Used when AI generation fails after credit was already deducted
CREATE OR REPLACE FUNCTION refund_reading_credit(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE reading_credits
  SET credits = credits + 1,
      total_used = GREATEST(total_used - 1, 0),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;
