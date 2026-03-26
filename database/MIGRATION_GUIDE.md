# Database Migration Guide

## ⚠️ Important: Read Before Running

This migration will transform your database from a single-role system to a multi-role system. **Back up your data before proceeding.**

---

## Step 1: Backup Your Data

In Supabase Dashboard → SQL Editor, run:

```sql
-- Create backup of profiles table
CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Verify backup
SELECT COUNT(*) FROM profiles_backup;
```

---

## Step 2: Run the Migration

1. Open the file: [`database/migration_multi_role.sql`](file:///c:/Users/danie/Documents/Libroloop/database/migration_multi_role.sql)
2. Copy the entire contents
3. Go to **Supabase Dashboard** → **SQL Editor**
4. Paste the SQL and click **Run**

The migration will:
- ✅ Add `roles` array column to profiles
- ✅ Migrate existing `role` data to `roles` array
- ✅ Create `seller_profiles` table
- ✅ Create `addresses` table
- ✅ Create `cart_items` table  
- ✅ Create `orders` table
- ✅ Update trigger for new user creation
- ✅ Set up RLS policies
- ✅ Create helper functions

---

## Step 3: Verify the Migration

Run these verification queries in SQL Editor:

```sql
-- 1. Check profiles structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 2. Check all new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('seller_profiles', 'addresses', 'cart_items', 'orders');

-- 3. Check existing users have roles array
SELECT id, email, roles FROM profiles LIMIT 5;

-- 4. Verify trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Expected results:
- `profiles` should have `roles` column (text array)
- All 4 new tables should exist
- Existing users should have `roles = {comprador}` or similar
- Trigger should be active on `auth.users`

---

## Step 4: Test User Creation

Create a test user to verify the trigger works:

1. Go to `http://localhost:3001/register`
2. Create a new account
3. Check in Supabase → Table Editor → `profiles`
4. The new user should have `roles = {comprador}`

---

## Rollback (If Needed)

If something goes wrong, run:

```sql
-- Drop new tables
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS seller_profiles CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.user_has_role(uuid, text);
DROP FUNCTION IF EXISTS public.add_role_to_user(uuid, text);

-- Restore profiles from backup
DELETE FROM profiles;
INSERT INTO profiles SELECT * FROM profiles_backup;
```

---

## Next Steps

After successful migration:
1. ✅ Database schema is updated
2. ⏭️ Update TypeScript types
3. ⏭️ Update middleware for multi-role support
4. ⏭️ Begin implementing public landing page

---

## Troubleshooting

### Error: "column 'role' does not exist"
This means the migration already ran partially. Check if `roles` column exists:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
```

### Error: "relation already exists"
Tables already exist. You can either:
- Drop them manually and re-run
- Skip to verification step

### Users have empty roles array
Run this to fix:
```sql
UPDATE profiles SET roles = ARRAY['comprador']::text[] WHERE roles IS NULL OR roles = '{}';
```
