# Cómo configurar Supabase para ZeroGap

Guía paso a paso para dejar el backend de Supabase listo la primera vez. Solo se
hace una vez por ambiente (una vez para desarrollo local, otra vez si creas un
proyecto Supabase separado para producción).

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Elige organización, nombre (p. ej. `zerogap`), contraseña de base de datos
   (guárdala, no se puede recuperar después) y región (la más cercana a Costa
   Rica: `us-east-1` suele ser la más rápida).
3. Espera 1-2 minutos a que aprovisione el proyecto.

## 2. Copiar las credenciales a `.env.local`

En el dashboard: **Project Settings → API**.

En la raíz del repo:

```bash
cp .env.example .env.local
```

Completa `.env.local` con:

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "Project API keys" → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | "Project API keys" → `service_role` (⚠️ secreta, nunca la subas a git ni la pongas en `NEXT_PUBLIC_*`) |

`.env.local` ya está en `.gitignore`, no se commitea.

Si vas a desplegar en Vercel, estas mismas 3 variables se agregan también en
**Vercel → tu proyecto → Settings → Environment Variables** (con
`SUPABASE_SERVICE_ROLE_KEY` marcada como solo para el servidor).

## 3. Correr la migración (crea las tablas, RLS, y el bucket de Storage)

Tienes dos formas de aplicar `supabase/migrations/0001_init.sql`. Usa la **Opción
A** si es la primera vez y no quieres instalar nada.

### Opción A — SQL Editor del dashboard (más simple)

1. En el dashboard de tu proyecto: **SQL Editor → New query**.
2. Abre el archivo `supabase/migrations/0001_init.sql` de este repo, copia todo
   su contenido y pégalo en el editor.
3. Click **Run**. Debe terminar sin errores (son ~15 statements: tipos, tablas,
   índices, función `is_admin()`, políticas RLS, bucket de Storage).
4. Verifica en **Table Editor** que aparecen `profiles`, `expenses`, `mileage`,
   `expense_photos`, y en **Storage** el bucket `receipts` (privado).

### Opción B — Supabase CLI (recomendado si vas a seguir agregando migraciones)

```bash
npx supabase login
npx supabase link --project-ref <tu-project-ref>   # está en Project Settings → General
npx supabase db push
```

Esto aplica todas las migraciones de `supabase/migrations/` en orden y queda
registrado qué se aplicó, para que la próxima migración (`0002_...sql`) se
pueda empujar igual con `db push` sin repetir la 0001.

## 4. Crear el primer usuario ADMIN

El sistema **no tiene registro público** — Administración crea al resto de
usuarios desde `/admin/empleados`. Pero el primer admin hay que crearlo a mano
una sola vez (problema del huevo y la gallina):

1. Dashboard → **Authentication → Users → Add user**. Ingresa tu correo y una
   contraseña. Marca "Auto Confirm User" para no depender de un correo de
   verificación.
2. Copia el `UID` del usuario que se acaba de crear (columna en la tabla de
   usuarios, o entra al usuario para verlo).
3. Dashboard → **SQL Editor** y corre (reemplazando los valores):

   ```sql
   insert into profiles (id, first_name, last_name, email, role, status)
   values (
     '<UID copiado en el paso 2>',
     'Tu nombre',
     'Tu apellido',
     'tu@correo.com',
     'ADMIN',
     'ACTIVE'
   );
   ```

4. Listo. Ese correo/contraseña ya funciona en `/login` de la app y entra
   directo a `/admin`.

## 5. Probar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`, entra con el admin que acabas de crear, y desde
**Empleados → + Nuevo empleado** crea al resto del equipo (a cada uno se le
genera una contraseña temporal que debes compartirle por un canal seguro — el
sistema no envía correos todavía, eso no está en el alcance del MVP).

## Cuando el esquema cambie más adelante

No se edita `0001_init.sql` una vez aplicado. Se agrega un archivo nuevo
numerado (`supabase/migrations/0002_algo.sql`) y se corre `npx supabase db
push` de nuevo (o se pega ese archivo nuevo en el SQL Editor). El estado real
del esquema se documenta en [`docs/database-schema.md`](./database-schema.md).
