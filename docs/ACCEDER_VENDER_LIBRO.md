# Cómo Acceder a la Página de Vender Libro

## Problema
La página `/dashboard/seller/sell` está protegida por el middleware y requiere que tengas el rol de **vendedor** para acceder.

## Solución Rápida

### Opción 1: Agregar rol de vendedor en Supabase (Recomendado)

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Abre el **SQL Editor**
3. Ejecuta este comando (reemplaza con tu email):

```sql
-- Agregar rol de vendedor a tu usuario
UPDATE profiles 
SET roles = array_append(roles, 'vendedor')
WHERE email = 'tu-email@example.com'
AND NOT ('vendedor' = ANY(roles));

-- Verificar que se aplicó
SELECT email, roles FROM profiles WHERE email = 'tu-email@example.com';
```

4. **Recarga la página** en tu navegador (F5)
5. Ahora deberías ver el **switcher de roles** en el menú
6. Cambia a "Modo Vendedor"
7. Navega a `/dashboard/seller/sell`

### Opción 2: Usar el switcher de roles

Si ya tienes el rol de vendedor pero estás en modo comprador:

1. Busca el botón del switcher en el menú (ej: "🛒 Comprador ▼")
2. Click en el botón
3. Selecciona "💼 Modo Vendedor"
4. Serás redirigido automáticamente a `/dashboard/seller`
5. Desde ahí, click en "Vender Libro"

## La Página Ya Existe

La página de vender libro **ya está completamente implementada** en:
- **Ruta:** `/dashboard/seller/sell`
- **Archivo:** `app/dashboard/seller/sell/page.tsx`

### Características del Formulario:

✅ **Campos:**
- Título del libro (requerido)
- Autor (requerido)
- Descripción (opcional)
- Precio en MXN (requerido)
- ISBN (opcional)
- Condición: Nuevo, Como Nuevo, Bueno, Aceptable
- Categoría: 8 opciones (Ficción, No Ficción, Ciencia, etc.)
- URL de imagen con preview en tiempo real

✅ **Funcionalidades:**
- Validación de campos requeridos
- Preview de imagen
- Mensajes de éxito/error
- Redirección automática a "Mis Libros" después de publicar
- Botón de cancelar
- Loading state

## Verificar tu Rol Actual

Para ver qué roles tienes actualmente:

```sql
SELECT email, roles 
FROM profiles 
WHERE email = 'tu-email@example.com';
```

Deberías ver algo como:
- `{comprador}` - Solo comprador
- `{comprador, vendedor}` - Comprador y vendedor ✅
- `{comprador, vendedor, admin}` - Todos los roles

## Flujo Completo

```
1. Agregar rol de vendedor en Supabase
   └─ Ejecutar SQL: UPDATE profiles SET roles = ...

2. Recargar la página
   └─ F5 o Ctrl+R

3. Ver el switcher aparecer
   └─ Botón "🛒 Comprador ▼" o "💼 Vendedor ▼"

4. Cambiar a modo vendedor
   └─ Click en switcher → "Modo Vendedor"

5. Acceder a la página de vender
   └─ Navegar a /dashboard/seller/sell
   └─ O click en "Vender Libro" en el dashboard
```

## Troubleshooting

**No veo el switcher:**
- Verifica que tienes múltiples roles en la BD
- Recarga la página después de agregar el rol

**Me redirige a la home:**
- El middleware está bloqueando el acceso
- Verifica que tienes el rol de vendedor
- Revisa la consola del navegador por errores

**La página muestra algo diferente:**
- Limpia el caché del navegador
- Verifica que estás en la ruta correcta: `/dashboard/seller/sell`
- Asegúrate de estar en modo vendedor
