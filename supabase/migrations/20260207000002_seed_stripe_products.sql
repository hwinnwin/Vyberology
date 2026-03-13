-- Seed Stripe products and prices (test mode IDs)
INSERT INTO products (stripe_product_id, name, description, active) VALUES
  ('prod_TvyYFzkOufFocF', 'Lite Reading', 'Quick numerology reading with basic insights (~200 words)', true),
  ('prod_TvyYpTeWzqzavX', 'Standard Reading', 'Comprehensive numerology reading with detailed analysis (~400 words)', true),
  ('prod_TvyYImky4akQm1', 'Deep Reading', 'In-depth numerology reading with full AI interpretation (~1000 words)', true),
  ('prod_TvyYD98AmGN6fA', '5 Reading Credits', 'Pack of 5 reading credits for any tier', true),
  ('prod_TvyZNzurIzAhCD', '10 Reading Credits', 'Pack of 10 reading credits - Best Value (10% off)', true),
  ('prod_TvyaYdJM6NLAQB', '25 Reading Credits', 'Pack of 25 reading credits - Premium (20% off)', true)
ON CONFLICT (stripe_product_id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO prices (product_id, stripe_price_id, currency, unit_amount, active) VALUES
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_TvyYFzkOufFocF'), 'price_1Sy6bTKQHOT2DNgNacYKJc17', 'usd', 997, true),
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_TvyYpTeWzqzavX'), 'price_1Sy6bkKQHOT2DNgN2W2z2Sbf', 'usd', 1997, true),
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_TvyYImky4akQm1'), 'price_1Sy6bkKQHOT2DNgN6Tzp149U', 'usd', 3997, true),
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_TvyYD98AmGN6fA'), 'price_1Sy6blKQHOT2DNgNWjYtA0H1', 'usd', 4997, true),
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_TvyZNzurIzAhCD'), 'price_1Sy6cpKQHOT2DNgNXF72VOaN', 'usd', 8997, true),
  ((SELECT id FROM products WHERE stripe_product_id = 'prod_TvyaYdJM6NLAQB'), 'price_1Sy6d9KQHOT2DNgNeAn6hKtl', 'usd', 19997, true)
ON CONFLICT (stripe_price_id) DO UPDATE SET unit_amount = EXCLUDED.unit_amount, active = EXCLUDED.active;
