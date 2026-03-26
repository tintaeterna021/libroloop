-- Este script permite a un usuario registrarse como vendedor de forma segura
-- Bypass de RLS para actualizar los roles y el teléfono tras registrarse
CREATE OR REPLACE FUNCTION upgrade_to_vendedor(user_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario exista
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Actualizar el perfil del usuario autenticado
  UPDATE public.profiles
  SET 
    phone = user_phone,
    roles = CASE 
              WHEN NOT ('vendedor' = ANY(roles)) THEN array_append(roles, 'vendedor')
              ELSE roles
            END
  WHERE id = auth.uid();
  
  -- Si el perfil aún no existe (race condition con el trigger), crearlo manualmente
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, phone, roles)
    VALUES (auth.uid(), user_phone, ARRAY['comprador', 'vendedor']::text[]);
  END IF;
END;
$$;
