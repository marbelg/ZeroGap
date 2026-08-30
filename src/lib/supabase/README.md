# `lib/supabase`

Tres clientes distintos, cada uno para un contexto de ejecución:

- **`client.ts`** — `createBrowserClient`, para Client Components.
- **`server.ts`** — `createServerClient` con manejo de cookies vía `next/headers`,
  para Server Components, Server Actions y Route Handlers. Respeta RLS con la
  sesión del usuario autenticado.
- **`admin.ts`** — `createAdminClient`, con la service role key. Bypassa RLS por
  completo. Importa `"server-only"` para que el build falle si algo intenta
  incluirlo en el bundle del navegador. **Solo se usa dentro de Server Actions ya
  protegidas por rol ADMIN** (ver `assertIsAdmin()` en
  `src/app/admin/empleados/actions.ts`) — nunca a partir de un Route Handler sin
  verificar el rol primero.
- **`proxy.ts`** — `updateSession()`, la lógica compartida que usa `proxy.ts` (raíz
  del proyecto) para refrescar la sesión y redirigir según autenticación/rol en
  cada request.
