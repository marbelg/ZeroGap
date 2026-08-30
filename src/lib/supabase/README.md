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

Además, **`storage.ts`** agrupa las funciones de subida/lectura de fotos en el
bucket `receipts` (validación de tipo/tamaño, URLs firmadas, y el saneo de la
extensión del archivo antes de usarla en la ruta — el nombre lo controla el
usuario, no es un cliente de Supabase en sí, por eso no está en la lista de
arriba).
