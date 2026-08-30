@AGENTS.md

# ZeroGap

WebApp de control de gastos de empleados (mobile-first). Especificación completa en
`docs/descripcion-del-sistema.md`.

Stack obligatorio: Next.js + TypeScript + Tailwind CSS + Supabase (Postgres, Auth,
Storage, RLS) + Vercel.

Principio de diseño del proyecto: **no sobrediseñar**. Preferir siempre la solución
simple que cumpla el requisito sobre la solución compleja.

## Documentación

- `docs/descripcion-del-sistema.md` es la fuente de verdad funcional del sistema.
  `descripcion del sistema.docx` se mantiene sincronizado con ese `.md` — se
  regenera con `npm run docs:docx` (`scripts/md-to-docx.js`), nunca se edita a
  mano.
- **No actualizar la documentación automáticamente.** El subagente
  `system-doc-sync` solo se invoca cuando el usuario lo pide explícitamente
  ("actualiza la documentación", "sincroniza la descripción del sistema") —
  decisión suya, para no gastar tokens documentando después de cada cambio.
