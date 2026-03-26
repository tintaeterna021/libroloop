-- Script para agregar el rol de vendedor a un usuario existente
-- Ejecuta esto en el SQL Editor de Supabase

-- Opción 1: Agregar rol de vendedor a un usuario específico por email
UPDATE profiles 
SET roles = array_append(roles, 'vendedor')
WHERE email = 'tu-email@example.com'
AND NOT ('vendedor' = ANY(roles)); -- Solo agrega si no lo tiene ya

-- Opción 2: Ver todos los usuarios y sus roles actuales
SELECT id, email, name, roles, created_at
FROM profiles
ORDER BY created_at DESC;

-- Opción 3: Agregar rol de vendedor a TODOS los usuarios (útil para testing)
UPDATE profiles 
SET roles = array_append(roles, 'vendedor')
WHERE NOT ('vendedor' = ANY(roles));

-- Opción 4: Crear un usuario de prueba con ambos roles
-- Primero crea el usuario en Authentication, luego ejecuta:
UPDATE profiles 
SET roles = ARRAY['comprador', 'vendedor']
WHERE email = 'test@example.com';

-- Opción 5: Agregar rol de admin (solo para testing)
UPDATE profiles 
SET roles = array_append(roles, 'admin')
WHERE email = 'admin@example.com'
AND NOT ('admin' = ANY(roles));

-- Verificar que se aplicó correctamente
SELECT email, roles 
FROM profiles 
WHERE email = 'tu-email@example.com';
