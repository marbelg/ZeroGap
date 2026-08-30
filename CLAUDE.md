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
- Después de cualquier cambio de código que afecte funcionalidad, datos o
  comportamiento (nuevo módulo, endpoint, tabla, política RLS, flujo de UI, fase
  completada), invocar el subagente `system-doc-sync` para mantener
  `docs/descripcion-del-sistema.md`, el `.docx` regenerado, y la documentación
  Markdown de cada módulo sincronizados con el código real. No es necesario para
  cambios cosméticos.
