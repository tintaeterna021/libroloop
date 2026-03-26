-- Script para reparar/garantizar las políticas de seguridad (RLS) de la tabla profiles
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Asegurarnos de que RLS esté activado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas conflictivas (por si existen y están bloqueando)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON profiles;

-- 3. Crear las políticas correctas

-- A. Cualquiera puede leer su propio perfil
CREATE POLICY "Users can view their own profile." 
ON profiles FOR SELECT 
TO authenticated 
USING ( auth.uid() = id );

-- B. Cualquiera puede actualizar su propio perfil
CREATE POLICY "Users can update own profile." 
ON profiles FOR UPDATE 
TO authenticated 
USING ( auth.uid() = id );

-- C. Cualquiera puede insertar su propio perfil (necesario para el registro)
CREATE POLICY "Users can insert their own profile." 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK ( auth.uid() = id );

-- D. Los administradores pueden ver todos los perfiles (necesario para el dashboard admin)
CREATE POLICY "Admins can view all profiles." 
ON profiles FOR SELECT 
TO authenticated 
USING ( 'admin' = ANY(roles) );

-- E. (Opcional) Los administradores pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles." 
ON profiles FOR UPDATE 
TO authenticated 
USING ( 'admin' = ANY(roles) );
