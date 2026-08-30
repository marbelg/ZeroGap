# PWA — instalación en Android

ZeroGap es instalable como app en Android/Chrome (y Chromium desktop). Piezas:

- `src/app/manifest.ts` — manifest generado por la convención nativa de Next.js
  (`MetadataRoute.Manifest`), servido en `/manifest.webmanifest`.
- `src/app/pwa-icons/[size]/route.tsx` — genera los íconos 192×192 y 512×512 (`any`
  y `maskable`) en runtime con `next/og`, sin depender de archivos PNG estáticos.
  Reemplazar por assets de marca reales cuando existan (mismo endpoint, mismo
  manifest — no requiere tocar el resto del código).
- `public/sw.js` — service worker mínimo. Cachea el app-shell (`/`, `/login`,
  `/manifest.webmanifest`) y usa estrategia network-first con ese cache como
  respaldo offline. No cachea llamadas a Supabase: la app depende de datos en
  vivo.
- `src/components/pwa/service-worker-register.tsx` — registra el service worker
  al montar el layout raíz.
- `src/components/pwa/install-prompt.tsx` — banner personalizado que escucha
  `beforeinstallprompt` y ofrece "Instalar" / "Ahora no". Si se descarta, no
  vuelve a aparecer por 14 días (guardado en `localStorage`).

## Limitación conocida (no es un bug)

`beforeinstallprompt` solo lo dispara Chrome/Edge en Android (y Chromium en
escritorio) cuando se cumplen los criterios de instalabilidad (manifest válido +
service worker + HTTPS). **iOS Safari no dispara este evento** — ahí no existe
prompt de instalación automático; el usuario debe usar manualmente "Compartir →
Agregar a pantalla de inicio". Esto es una limitación de la plataforma, no del
código, y coincide con el alcance pedido (instalación en Android).
