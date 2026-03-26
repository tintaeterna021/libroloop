-- ============================================================
-- LIBROLOOP — CRM fields migration
-- Run this in the Supabase SQL editor
-- ============================================================

-- Add suspended flag and admin notes to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes      text;
