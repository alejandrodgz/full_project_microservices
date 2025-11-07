This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Estructura del Proyecto

### Constantes de API (`lib/api-constants.ts`)

Este archivo centraliza todos los endpoints y configuraciones de la aplicación:

**Rutas de navegación:**
```typescript
import { APP_ROUTES } from '@/lib/api-constants'

// Navegación
router.push(APP_ROUTES.LOGIN)
router.push(APP_ROUTES.DOCUMENTS.BASE)
<Link href={APP_ROUTES.REGISTER}>Registrarse</Link>
```

**Endpoints internos (Next.js API Routes):**
```typescript
import { API_ROUTES } from '@/lib/api-constants'

// Autenticación
fetch(API_ROUTES.AUTH.LOGIN, { method: 'POST', ... })
fetch(API_ROUTES.AUTH.ME)

// Documentos
fetch(API_ROUTES.DOCUMENTS.BASE)
fetch(API_ROUTES.DOCUMENTS.BY_ID('123'))
```

**Configuración de cookies:**
```typescript
import { COOKIE_CONFIG } from '@/lib/api-constants'

cookie.serialize(COOKIE_CONFIG.ACCESS_TOKEN.name, token, COOKIE_CONFIG.ACCESS_TOKEN)
```

**Configuración de la app:**
```typescript
import { APP_CONFIG } from '@/lib/api-constants'

const secret = APP_CONFIG.JWT_SECRET
const isProduction = APP_CONFIG.IS_PRODUCTION
```

### Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
AUTH_BASE_URL=https://tu-api-auth.com
DOCUMENTS_BASE_URL=https://tu-api-docs.com
JWT_SECRET=tu-secreto-jwt
NODE_ENV=development
```

### Ventajas de la Centralización

- ✅ Cambios centralizados en un solo lugar
- ✅ Autocompletado y type-safety con TypeScript
- ✅ Evita errores de tipeo en URLs
- ✅ Configuración de cookies consistente
- ✅ Fácil mantenimiento y escalabilidad
