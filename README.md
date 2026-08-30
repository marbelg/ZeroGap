# ZeroGap

WebApp de control de gastos de empleados. Especificación funcional completa en
[`docs/descripcion-del-sistema.md`](docs/descripcion-del-sistema.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth,
Storage, RLS) · Vercel.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar con las credenciales de tu proyecto Supabase
npm run dev
```

Antes de levantar la app por primera vez necesitas un proyecto Supabase con el
esquema aplicado y un usuario ADMIN — guía completa paso a paso en
[`docs/supabase-setup.md`](docs/supabase-setup.md).

## Documentación

- [`docs/descripcion-del-sistema.md`](docs/descripcion-del-sistema.md) — fuente de
  verdad funcional (se mantiene sincronizada con el código, ver `CLAUDE.md`).
  `descripcion del sistema.docx` es la misma información en Word — se regenera
  con `npm run docs:docx`, no se edita a mano.
- [`docs/supabase-setup.md`](docs/supabase-setup.md) — cómo crear el proyecto
  Supabase, correr las migraciones y crear el primer admin.
- [`docs/database-schema.md`](docs/database-schema.md) — esquema de base de datos y
  RLS (estado actual, no guía de instalación).
- [`docs/pwa.md`](docs/pwa.md) — instalación como app en Android.
- `src/lib/supabase/README.md` — qué cliente de Supabase usar en cada contexto.

## PWA

La app es instalable en Android/Chrome (manifest + service worker + banner de
instalación). Ver [`docs/pwa.md`](docs/pwa.md).
