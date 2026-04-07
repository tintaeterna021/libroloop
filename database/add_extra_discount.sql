-- ============================================================
-- LIBROLOOP — Add extra_discount_percent to books
-- Run this in the Supabase SQL editor
-- ============================================================

ALTER TABLE books 
  ADD COLUMN IF NOT EXISTS extra_discount_percent INTEGER DEFAULT 0;

-- Verification:
-- SELECT id, title, extra_discount_percent FROM books LIMIT 5;
