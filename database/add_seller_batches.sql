-- ============================================================
-- LIBROLOOP — Seller Batches (Lotes) schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- ── seller_batches table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_batches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','waiting_response','approved','published','rejected')),
  option_chosen int  CHECK (option_chosen IN (1, 2)),   -- 1=we store, 2=they store
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Add batch_id to books ─────────────────────────────────────
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES seller_batches(id) ON DELETE SET NULL;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_books_batch_id  ON books(batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_seller  ON seller_batches(seller_id);
CREATE INDEX IF NOT EXISTS idx_batches_status  ON seller_batches(status);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_batches_updated_at ON seller_batches;
CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON seller_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE seller_batches ENABLE ROW LEVEL SECURITY;

-- Sellers see their own batches
DROP POLICY IF EXISTS "Seller sees own batches" ON seller_batches;
CREATE POLICY "Seller sees own batches"
  ON seller_batches FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

-- Admin full access
DROP POLICY IF EXISTS "Admin manages all batches" ON seller_batches;
CREATE POLICY "Admin manages all batches"
  ON seller_batches FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
  )
  WITH CHECK (true);

-- Sellers can insert their own
DROP POLICY IF EXISTS "Seller inserts own batch" ON seller_batches;
CREATE POLICY "Seller inserts own batch"
  ON seller_batches FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());
