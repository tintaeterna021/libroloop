-- CUIDADO: Este script borrará TODOS los datos de tus tablas públicas.
-- Úsalo solo para reiniciar tu entorno de pruebas a cero.

TRUNCATE TABLE public.guest_orders CASCADE;
TRUNCATE TABLE public.seller_payments CASCADE;
TRUNCATE TABLE public.seller_batches CASCADE;
TRUNCATE TABLE public.books CASCADE;

-- Si también quieres borrar a todos los usuarios registrados (vendedores, compradores y admnistradores),
-- debes borrar desde auth.users. 
-- Descomenta la siguiente línea solo si estás absolutamente seguro:
-- TRUNCATE TABLE auth.users CASCADE;
-- TRUNCATE TABLE public.profiles CASCADE; 
