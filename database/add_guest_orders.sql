-- ============================================================
-- LIBROLOOP — Guest Orders Table
-- Run this in the Supabase SQL editor
-- ============================================================

-- Sequence for human-readable order numbers (LL-0001, LL-0002 …)
CREATE SEQUENCE IF NOT EXISTS guest_order_seq START 1001;

-- Main table
CREATE TABLE IF NOT EXISTS guest_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number  text UNIQUE NOT NULL DEFAULT 'LL-' || LPAD(nextval('guest_order_seq')::text, 4, '0'),
  -- Contact
  email         text NOT NULL,
  phone         text NOT NULL,
  recipient_name text NOT NULL,
  -- Address
  postal_code   text NOT NULL,
  colony        text NOT NULL,
  street        text NOT NULL,        -- includes ext + int number
  -- Financials
  payment_method text NOT NULL DEFAULT 'transferencia'
                  CHECK (payment_method IN ('efectivo','transferencia')),
  subtotal      decimal(10,2) NOT NULL,
  shipping      decimal(10,2) NOT NULL DEFAULT 60.00,
  total         decimal(10,2) NOT NULL,
  -- Cart snapshot (array of {book_id, title, price})
  items         jsonb NOT NULL DEFAULT '[]',
  -- Status
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  created_at    timestamptz DEFAULT now()
);

-- RLS: allow anonymous inserts (guests can place orders without login)
ALTER TABLE guest_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can insert orders" ON guest_orders;
CREATE POLICY "Guests can insert orders"
  ON guest_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Authenticated users can view their own orders (matched by email)
DROP POLICY IF EXISTS "Users can view own orders" ON guest_orders;
CREATE POLICY "Users can view own orders"
  ON guest_orders FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));


-- Admins/service role can read all orders (via Supabase dashboard or Edge Functions)
-- No SELECT policy for anon — order data stays private after submission
