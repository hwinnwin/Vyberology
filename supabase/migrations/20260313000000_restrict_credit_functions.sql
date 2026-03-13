-- Restrict credit-granting functions to service role only
-- Security fix: authenticated users can currently call add_reading_credits via RPC

-- Pin search_path to prevent search_path hijacking
ALTER FUNCTION add_reading_credits(UUID, INTEGER, UUID) SET search_path = public;
ALTER FUNCTION use_reading_credit(UUID) SET search_path = public;
ALTER FUNCTION get_user_credits(UUID) SET search_path = public;

-- Revoke execute from non-service roles
REVOKE EXECUTE ON FUNCTION add_reading_credits(UUID, INTEGER, UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION add_reading_credits(UUID, INTEGER, UUID) FROM anon;

-- use_reading_credit and get_user_credits are called from edge functions too,
-- but get_user_credits is read-only and safe for authenticated users.
-- use_reading_credit has its own guard (checks credit balance before deducting).
-- Only add_reading_credits is dangerous because it grants arbitrary credits.
