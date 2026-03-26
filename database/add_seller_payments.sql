-- ============================================================
-- LIBROLOOP — Seller Payments (Historial de Pagos) schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- ── seller_payments: immutable payment ledger ─────────────────
CREATE TABLE IF NOT EXISTS seller_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount          numeric(10,2) NOT NULL,
  book_ids        uuid[]        NOT NULL DEFAULT '{}',  -- books included in payout
  receipt_url     text,                                 -- uploaded proof of transfer
  notes           text,
  paid_at         timestamptz   NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id)        -- admin who triggered it
);

-- ── Add banking fields to profiles ────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bank_name  text,
  ADD COLUMN IF NOT EXISTS clabe      text,
  ADD COLUMN IF NOT EXISTS bank_alias text;

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_seller ON seller_payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON seller_payments(paid_at DESC);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE seller_payments ENABLE ROW LEVEL SECURITY;

-- Sellers can read their own payments
DROP POLICY IF EXISTS "Seller sees own payments" ON seller_payments;
CREATE POLICY "Seller sees own payments"
  ON seller_payments FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

-- Admin full access
DROP POLICY IF EXISTS "Admin manages all payments" ON seller_payments;
CREATE POLICY "Admin manages all payments"
  ON seller_payments FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
  )
  WITH CHECK (true);

-- ── Storage bucket for payment receipts ───────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Allow admin to upload receipts
DROP POLICY IF EXISTS "Admin uploads receipts" ON storage.objects;
CREATE POLICY "Admin uploads receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
  );

-- Allow admin + sellers to view receipts they're involved in
DROP POLICY IF EXISTS "View receipts" ON storage.objects;
CREATE POLICY "View receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts');
