-- ============================================
-- CREATE BOOKS TABLE
-- Run this BEFORE the main migration
-- ============================================

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'available' CHECK (status IN ('available', 'sold', 'revision')),
  image_url text,
  isbn text,
  condition text CHECK (condition IN ('new', 'like_new', 'good', 'acceptable')),
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Policies for books
CREATE POLICY "Anyone can view available books"
  ON books FOR SELECT
  USING (status = 'available' OR status = 'sold');

CREATE POLICY "Sellers can view their own books"
  ON books FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own books"
  ON books FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own books"
  ON books FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Admins can do everything
CREATE POLICY "Admins can view all books"
  ON books FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

CREATE POLICY "Admins can update all books"
  ON books FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_books_seller_id ON books(seller_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
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
