# Guía Rápida: Cierre de Sesión y Switcher de Roles

## ✅ El código ya está implementado y funcionando

El componente `Navigation.tsx` ya tiene toda la funcionalidad necesaria:

### 🚪 Cierre de Sesión

**Ubicación:**
- **Desktop**: Botón "Salir" en rojo en la esquina superior derecha
- **Mobile**: "Cerrar Sesión" al final del menú desplegable

**Funcionamiento:**
```typescript
const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
}
```

**Qué hace:**
1. Cierra la sesión en Supabase
2. Limpia el token de autenticación
3. Redirige a la página principal (`/`)
4. El menú se actualiza automáticamente para mostrar opciones de usuario no autenticado

---

### 🔄 Switcher de Roles

**Cuándo aparece:**
- Solo si el usuario tiene **múltiples roles** en su perfil
- Ejemplo: `roles: ['comprador', 'vendedor']`

**Ubicación:**
- **Desktop**: Botón dropdown junto a los links de navegación
  - Muestra: "🛒 Comprador ▼", "💼 Vendedor ▼", o "⚙️ Admin ▼"
- **Mobile**: Sección "Cambiar Rol" en el menú desplegable

**Funcionamiento:**
```typescript
const switchRole = (role: 'comprador' | 'vendedor' | 'admin') => {
    setCurrentRole(role)
    setMenuOpen(false)
    
    // Redirect to appropriate dashboard
    if (role === 'admin') {
        router.push('/dashboard/admin')
    } else if (role === 'vendedor') {
        router.push('/dashboard/seller')
    } else {
        router.push('/')
    }
}
```

**Qué hace:**
1. Cambia el rol actual en el estado local
2. Cierra el menú dropdown
3. Redirige al dashboard correspondiente:
   - **Comprador** → `/` (catálogo)
   - **Vendedor** → `/dashboard/seller`
   - **Admin** → `/dashboard/admin`
4. El menú se actualiza automáticamente con los links del nuevo rol

---

## 🧪 Cómo Probar

### Probar Cierre de Sesión

1. Inicia sesión en `/login`
2. Verás el botón "Salir" en el menú
3. Click en "Salir"
4. Deberías ser redirigido a `/`
5. El menú ahora muestra "Iniciar Sesión" en lugar de "Salir"

### Probar Switcher de Roles

**Primero, necesitas un usuario con múltiples roles:**

#### Opción 1: Agregar rol manualmente en Supabase

```sql
-- En Supabase SQL Editor
UPDATE profiles 
SET roles = ARRAY['comprador', 'vendedor']
WHERE email = 'tu-email@example.com';
```

#### Opción 2: Crear script de prueba

Crea un archivo `scripts/add-seller-role.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Necesitas esta key
)

async function addSellerRole(email: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (!profile) {
    console.log('Usuario no encontrado')
    return
  }

  const currentRoles = profile.roles || []
  if (!currentRoles.includes('vendedor')) {
    currentRoles.push('vendedor')
  }

  await supabase
    .from('profiles')
    .update({ roles: currentRoles })
    .eq('email', email)

  console.log('Rol de vendedor agregado!')
}

// Uso
addSellerRole('tu-email@example.com')
```

### Después de agregar el rol:

1. Recarga la página
2. Deberías ver el botón del switcher (ej: "🛒 Comprador ▼")
3. Click en el botón
4. Verás "💼 Modo Vendedor" en el dropdown
5. Click en "Modo Vendedor"
6. Serás redirigido a `/dashboard/seller`
7. El menú ahora muestra las opciones de vendedor
8. Puedes volver a cambiar a comprador repitiendo el proceso

---

## 📋 Checklist de Funcionalidad

### Cierre de Sesión
- [x] Botón "Salir" visible cuando estás autenticado
- [x] Click en "Salir" cierra la sesión
- [x] Redirige a la página principal
- [x] Menú se actualiza para usuario no autenticado
- [x] Funciona en desktop y mobile

### Switcher de Roles
- [x] Solo aparece si tienes múltiples roles
- [x] Muestra el rol actual
- [x] Dropdown con roles disponibles
- [x] Click cambia el rol y redirige
- [x] Menú se actualiza con links del nuevo rol
- [x] Funciona en desktop y mobile
- [x] Cierra el dropdown automáticamente

---

## 🎯 Flujo Completo de Prueba

```
1. Registrarse como comprador
2. Agregar rol de vendedor en la BD
3. Recargar la página
4. Ver switcher aparecer
5. Cambiar a modo vendedor
6. Ver dashboard de vendedor
7. Cambiar de vuelta a comprador
8. Ver catálogo
9. Cerrar sesión
10. Ver menú de usuario no autenticado
```

---

## 💡 Notas Importantes

1. **El switcher solo aparece con múltiples roles** - Si solo tienes un rol, no lo verás
2. **El rol se guarda en el estado local** - Al recargar, se selecciona el rol de mayor privilegio
3. **La redirección es automática** - No necesitas navegar manualmente
4. **El menú es reactivo** - Se actualiza instantáneamente al cambiar de rol
5. **Funciona en mobile y desktop** - Diseño responsive completo

---

## 🔧 Troubleshooting

**No veo el switcher:**
- Verifica que tu usuario tenga múltiples roles en la BD
- Recarga la página después de agregar roles

**El switcher no cambia el menú:**
- Verifica que el componente Navigation esté en el layout
- Revisa la consola por errores

**El cierre de sesión no funciona:**
- Verifica la conexión con Supabase
- Revisa que `.env.local` tenga las credenciales correctas

**Después de cambiar de rol, veo un 404:**
- Verifica que las rutas existan (`/dashboard/seller`, `/dashboard/admin`)
- Revisa el middleware para permisos
