# Esquema de base de datos

Refleja el estado actual del esquema en Supabase Postgres. Fuente: todas las
migraciones en `supabase/migrations/` (`0001_init.sql` .. `0009_add_hotel_reported_rate.sql`
al momento de escribir esto). Este documento describe el estado real —no un
historial de cambios—; cuando el esquema cambie, se actualiza aquí y se agrega una
nueva migración numerada, nunca se edita una migración ya aplicada.

## Tipos (enums)

| Tipo | Valores |
|------|---------|
| `user_role` | `ADMIN`, `EMPLOYEE`, `EMPLEADO_INDIRECTO` (0006), `CAJA_CHICA` (0006), `HOTEL` (0008) |
| `user_status` | `ACTIVE`, `INACTIVE` |
| `expense_type` | `DESAYUNO`, `ALMUERZO`, `CENA`, `KILOMETRAJE`, `REPARACION_LLANTAS` (0004), `CAJA_CHICA` (0006), `HOSPEDAJE` (0008) |
| `expense_status` | `REPORTADO`, `APROBADO`, `RECHAZADO` |
| `currency_code` | `USD`, `CRC` |
| `photo_type` | `COMPROBANTE`, `ODOMETRO_INICIAL`, `ODOMETRO_FINAL` |

## Tablas

### `profiles`

Extiende `auth.users` 1:1 (mismo `id`). Se crea explícitamente desde el server
action `createEmployee` (no hay trigger automático de auto-registro, ya que el
sistema no tiene signup público).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | FK → `auth.users.id`, `on delete cascade` |
| `first_name` / `last_name` | text | Para rol `HOTEL`, `first_name` guarda el nombre del hotel y `last_name` queda vacío — no hay apellido. |
| `email` | text | único |
| `role` | `user_role` | default `EMPLOYEE` |
| `status` | `user_status` | default `ACTIVE`; `INACTIVE` bloquea el login |
| `phone` | text | opcional (migración `0002`) |
| `cedula` | text | opcional (migración `0005`) |
| `bank_account` | text | opcional (migración `0005`) |
| `department`, `position` | text | opcionales |
| `employee_code` | text | opcional, **único** (migración `0003`). Prefijo por rol generado por la app (`generateUniqueEmployeeCode` en `src/app/admin/empleados/actions.ts`): `A` admin, `E` empleado, `N` empleado no directo, `C` caja chica, `H` hotel, seguido de 3 dígitos secuenciales por rol — al agotar los 999 números de un rol, sigue con el sufijo de letra `EA001`, `EB001`, etc. |
| `nightly_rate` | numeric(12,2) | solo rol `HOTEL` (migración `0008`); tarifa por noche que el admin le configura al hotel — usada para calcular el monto de sus gastos de tipo `HOSPEDAJE` (ver tabla `expenses`), no la tarifa que el hotel reporta. |
| `created_at` | timestamptz | default `now()` |

### `expenses`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | — |
| `user_id` | uuid FK → `profiles.id` | `on delete cascade` |
| `type` | `expense_type` | — |
| `date`, `time` | date / time | — |
| `amount` | numeric(12,2) | `>= 0`. Para `KILOMETRAJE` empieza en 0 y lo calcula el admin (km × `app_settings.km_rate`) al asignar kilómetros; para `HOSPEDAJE` lo calcula el servidor como `nights × profiles.nightly_rate` del hotel al crear el gasto. |
| `currency` | `currency_code` | — |
| `description` | text | opcional en general; **obligatoria** en la app para `CAJA_CHICA` (no es una restricción de base de datos, se valida en el server action) |
| `nights` | integer | solo `HOSPEDAJE` (migración `0008`) |
| `reported_rate` | numeric(12,2) | solo `HOSPEDAJE` (migración `0009`) — tarifa por noche que el hotel dice haber aplicado; si difiere de `profiles.nightly_rate` del hotel, el admin ve una alerta al revisar el gasto (no afecta el monto calculado) |
| `status` | `expense_status` | default `REPORTADO` |
| `rejection_reason` | text | se llena cuando `status = RECHAZADO` |
| `created_at`, `updated_at` | timestamptz | `updated_at` se actualiza vía trigger `set_updated_at` |

### `mileage`

1:1 con un `expense` de tipo `KILOMETRAJE`. El empleado ya no llena estos datos: el
formulario de kilometraje solo pide fecha + 2 fotos, y esta fila la crea el admin
(`assignMileageKm` en `src/app/admin/gastos/actions.ts`, `upsert` por `expense_id`)
al asignar los kilómetros — `start_location`/`end_location` quedan como `"—"` y
`initial_odometer` en `0`; solo `final_odometer` (= km asignados) es real.

| Columna | Tipo | Notas |
|---|---|---|
| `expense_id` | uuid FK único → `expenses.id` | `on delete cascade` |
| `start_location`, `end_location` | text | placeholder `"—"`, ya no los llena el empleado |
| `start_time`, `end_time` | time | se copian de `expenses.time` |
| `initial_odometer`, `final_odometer` | numeric(10,2) | `initial_odometer` queda en `0`; `final_odometer` = km asignados por el admin |
| `kilometers` | numeric(10,2) | columna generada: `final_odometer - initial_odometer` |

### `expense_photos`

| Columna | Tipo | Notas |
|---|---|---|
| `expense_id` | uuid FK → `expenses.id` | `on delete cascade` |
| `photo_type` | `photo_type` | — |
| `file_url` | text | referencia al objeto en Storage (bucket `receipts`) |

### `app_settings` (migración `0004`, extendida en `0007`)

Fila única (`id boolean primary key default true`, con `check (id)` que fuerza que
solo pueda existir esa fila) de configuración global editable por un admin. Ver
`src/lib/settings.ts` (`getAppSettings`) y `src/app/admin/configuracion/actions.ts`.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | boolean PK | siempre `true`, fila única |
| `weekly_budget_total` | numeric(12,2) | presupuesto semanal informativo, `0` = sin aviso |
| `weekly_budget_desayuno` / `_almuerzo` / `_cena` | numeric(12,2) | ídem, por categoría |
| `km_rate` | numeric(12,2) | tarifa por km usada al asignar kilometraje (ver tabla `mileage`) |
| `payment_day_of_week` | smallint | `0`=domingo .. `6`=sábado (igual que `Date#getDay()`); día en que se paga la semana anterior |
| `monthly_budget_caja_chica` | numeric(12,2) | migración `0007`; presupuesto mensual informativo para el rol `CAJA_CHICA` |
| `monthly_budget_no_directo` | numeric(12,2) | migración `0007`; ídem para el rol `EMPLEADO_INDIRECTO` |
| `updated_at` | timestamptz | se actualiza vía trigger `app_settings_set_updated_at` |

## Row Level Security

Todas las tablas tienen RLS activo. Regla general: un usuario no-admin (`EMPLOYEE`,
`EMPLEADO_INDIRECTO`, `CAJA_CHICA` o `HOTEL`) solo puede leer/escribir sus propios
registros (`user_id = auth.uid()`, o vía el `expense_id` asociado para
`mileage`/`expense_photos`); un `ADMIN` tiene acceso completo. `app_settings` es la
excepción: cualquier usuario autenticado puede **leer** la fila (el empleado
necesita ver el día de pago), pero solo un `ADMIN` puede **actualizarla**.

La función `is_admin()` (security definer) evita la recursión que ocurriría si una
policy sobre `profiles` intentara hacer `select` directo sobre `profiles`.

## Storage

Bucket privado `receipts` para comprobantes de alimentación, caja chica y hospedaje,
y fotos de odómetro. Políticas: cada usuario sube y lee solo sus propios objetos
(`owner = auth.uid()`); un admin puede leer y eliminar cualquiera.

## Cómo aplicar este esquema / crear el primer admin

Ver la guía paso a paso en [`docs/supabase-setup.md`](./supabase-setup.md) — crear
el proyecto, correr esta migración y crear el primer usuario ADMIN.
