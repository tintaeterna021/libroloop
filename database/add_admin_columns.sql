-- ============================================================
-- LIBROLOOP — Books table extra columns for admin workflow
-- Run this in the Supabase SQL editor
-- ============================================================

-- Add rejection reason (for "No Aprobado" status)
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS paid_out boolean DEFAULT false;

-- Add 'rejected' to the valid status values check
-- (If the books table has a status CHECK constraint, recreate it)
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_status_check;
ALTER TABLE books ADD CONSTRAINT books_status_check
  CHECK (status IN ('available', 'sold', 'revision', 'rejected'));

-- ── Admin policy: allow admin to read/update all books ──────
-- Enable unrestricted access for admin role (via service key or policy)
-- If you use RLS on books, add:
DROP POLICY IF EXISTS "Admin can manage all books" ON books;
CREATE POLICY "Admin can manage all books"
  ON books FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ── Admin policy: allow admin to read/update all guest_orders
DROP POLICY IF EXISTS "Admin can manage all guest_orders" ON guest_orders;
CREATE POLICY "Admin can manage all guest_orders"
  ON guest_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  )
  WITH CHECK (true);

-- ── Admin policy: allow admin to read all profiles
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND 'admin' = ANY(p.roles)
    )
  );
