-- ============================================
-- LIBROLOOP DATABASE MIGRATION
-- Multi-Role System Implementation
-- ============================================

-- STEP 1: Backup existing data
-- Before running this migration, backup your profiles table:
-- CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- ============================================
-- PART 1: Update profiles table
-- ============================================

-- Add new columns to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY['comprador']::text[],
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Migrate existing role data to roles array
UPDATE profiles 
SET roles = ARRAY[role]::text[]
WHERE role IS NOT NULL AND roles IS NULL;

-- Drop old role column (after migration)
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Add constraint to ensure valid roles
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS valid_roles;
  
ALTER TABLE profiles
  ADD CONSTRAINT valid_roles CHECK (
    roles <@ ARRAY['comprador', 'vendedor', 'admin']::text[]
  );

-- ============================================
-- PART 2: Create seller_profiles table
-- ============================================

CREATE TABLE IF NOT EXISTS seller_profiles (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  business_name text,
  bank_account text,
  tax_id text,
  verified boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for seller_profiles
CREATE POLICY "Users can view their own seller profile"
  ON seller_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seller profile"
  ON seller_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller profile"
  ON seller_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- PART 3: Create addresses table
-- ============================================

CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  street text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  country text DEFAULT 'México',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Policies for addresses
CREATE POLICY "Users can view their own addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- PART 4: Create cart_items table
-- ============================================

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policies for cart_items
CREATE POLICY "Users can view their own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own cart"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- PART 5: Create orders table
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id),
  seller_id uuid REFERENCES profiles(id),
  book_id uuid REFERENCES books(id),
  quantity integer CHECK (quantity > 0),
  total_price decimal(10,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address_id uuid REFERENCES addresses(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Buyers can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view orders for their books"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update order status"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id);

-- ============================================
-- PART 6: Update trigger for new users
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function with roles array
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with default 'comprador' role
  INSERT INTO public.profiles (id, email, roles)
  VALUES (
    NEW.id,
    NEW.email,
    ARRAY['comprador']::text[]
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 7: Helper functions
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_id uuid, role_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role_name = ANY(roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add role to user
CREATE OR REPLACE FUNCTION public.add_role_to_user(user_id uuid, role_name text)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET roles = array_append(roles, role_name)
  WHERE id = user_id AND NOT (role_name = ANY(roles));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the migration worked:

-- 1. Check profiles structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- 2. Check all new tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('seller_profiles', 'addresses', 'cart_items', 'orders');

-- 3. Check existing users have roles array
-- SELECT id, email, roles FROM profiles LIMIT 5;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To rollback this migration:
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS cart_items CASCADE;
-- DROP TABLE IF EXISTS addresses CASCADE;
-- DROP TABLE IF EXISTS seller_profiles CASCADE;
-- DROP FUNCTION IF EXISTS public.user_has_role(uuid, text);
-- DROP FUNCTION IF EXISTS public.add_role_to_user(uuid, text);
-- Restore from backup: INSERT INTO profiles SELECT * FROM profiles_backup;
