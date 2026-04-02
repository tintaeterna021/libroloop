-- Habilitar el bucket "books" permitiendo subidas para usuarios autenticados
-- 1. Insertar el bucket si no existe (y hacerlo público)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('books', 'books', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que cualquiera pueda ver/descargar los objetos del bucket 'books' 
CREATE POLICY "Permitir visualizar imágenes de libros a todos" 
ON storage.objects FOR SELECT
USING ( bucket_id = 'books' );

-- 3. Permitir que usuarios logueados (autenticados) puedan subir nuevas imágenes
CREATE POLICY "Permitir subida de imágenes a usuarios" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'books' );

-- 4. Permitir a usuarios modificar sus propias imágenes 
CREATE POLICY "Permitir a usuarios modificar sus propias imágenes"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'books' AND auth.uid() = owner );

-- 5. Permitir a usuarios eliminar sus propias imágenes
CREATE POLICY "Permitir a usuarios eliminar sus propias imágenes"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'books' AND auth.uid() = owner );
