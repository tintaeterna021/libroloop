# Libroloop

Aplicación de gestión de libros construida con Next.js 15, TypeScript, Tailwind CSS y Supabase.

## Stack Tecnológico

- **Frontend + Backend**: Next.js 15 (App Router) con TypeScript
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage (para portadas de libros)
- **Deploy**: Vercel

## Estructura del Proyecto

```
libroloop/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes (endpoints internos)
│   │   └── hello/         # Ejemplo de endpoint
│   ├── globals.css        # Estilos globales + Tailwind
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/            # Componentes React reutilizables
├── lib/                   # Utilidades y configuraciones
│   └── supabase.ts        # Cliente de Supabase
├── public/                # Archivos estáticos
└── .env.local.example     # Template de variables de entorno
```

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia `.env.local.example` a `.env.local`
3. Agrega tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Deploy en Vercel

1. Sube tu código a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Agrega las variables de entorno de Supabase
4. ¡Deploy automático!

## Próximos Pasos

- [ ] Configurar autenticación con Supabase Auth
- [ ] Crear esquema de base de datos para libros
- [ ] Implementar CRUD de libros
- [ ] Agregar Storage para portadas
- [ ] Crear interfaz de usuario


BD: 021Tinta021!