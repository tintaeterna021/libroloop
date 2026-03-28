-- ============================================
-- CREATE BOOKS TABLE (Simplified for Catalog Only)
-- Run this in your new Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  seller_id uuid, -- Reference removed, just a placeholder if needed
  status text DEFAULT 'available' CHECK (status IN ('available', 'sold', 'revision')),
  cover_url text,
  back_cover_url text,
  isbn text,
  category text,
  year integer,
  publisher text,
  genre text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous/public users to query the catalog
CREATE POLICY "Anyone can view available books"
  ON books FOR SELECT
  USING (status = 'available' OR status = 'sold');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
