# Esquema de base de datos

Refleja el estado actual del esquema en Supabase Postgres. Fuente: la migración
`supabase/migrations/0001_init.sql`. Este documento describe el estado real —no un
historial de cambios—; cuando el esquema cambie, se actualiza aquí y se agrega una
nueva migración numerada, nunca se edita una migración ya aplicada.

## Tipos (enums)

| Tipo | Valores |
|------|---------|
| `user_role` | `ADMIN`, `EMPLOYEE` |
| `user_status` | `ACTIVE`, `INACTIVE` |
| `expense_type` | `DESAYUNO`, `ALMUERZO`, `CENA`, `KILOMETRAJE` |
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
| `first_name` / `last_name` | text | — |
| `email` | text | único |
| `role` | `user_role` | default `EMPLOYEE` |
| `status` | `user_status` | default `ACTIVE`; `INACTIVE` bloquea el login |
| `department`, `position`, `employee_code` | text | opcionales |
| `created_at` | timestamptz | default `now()` |

### `expenses`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | — |
| `user_id` | uuid FK → `profiles.id` | `on delete cascade` |
| `type` | `expense_type` | — |
| `date`, `time` | date / time | — |
| `amount` | numeric(12,2) | `>= 0` |
| `currency` | `currency_code` | — |
| `description` | text | opcional |
| `status` | `expense_status` | default `REPORTADO` |
| `rejection_reason` | text | se llena cuando `status = RECHAZADO` |
| `created_at`, `updated_at` | timestamptz | `updated_at` se actualiza vía trigger `set_updated_at` |

### `mileage`

1:1 con un `expense` de tipo `KILOMETRAJE`.

| Columna | Tipo | Notas |
|---|---|---|
| `expense_id` | uuid FK único → `expenses.id` | `on delete cascade` |
| `start_location`, `end_location` | text | — |
| `start_time`, `end_time` | time | — |
| `initial_odometer`, `final_odometer` | numeric(10,2) | — |
| `kilometers` | numeric(10,2) | columna generada: `final_odometer - initial_odometer` |

### `expense_photos`

| Columna | Tipo | Notas |
|---|---|---|
| `expense_id` | uuid FK → `expenses.id` | `on delete cascade` |
| `photo_type` | `photo_type` | — |
| `file_url` | text | referencia al objeto en Storage (bucket `receipts`) |

## Row Level Security

Todas las tablas tienen RLS activo. Regla general: un `EMPLOYEE` solo puede
leer/escribir sus propios registros (`user_id = auth.uid()`, o vía el `expense_id`
asociado para `mileage`/`expense_photos`); un `ADMIN` tiene acceso completo.

La función `is_admin()` (security definer) evita la recursión que ocurriría si una
policy sobre `profiles` intentara hacer `select` directo sobre `profiles`.

## Storage

Bucket privado `receipts` para comprobantes de alimentación y fotos de odómetro.
Políticas: cada usuario sube y lee solo sus propios objetos (`owner = auth.uid()`);
un admin puede leer y eliminar cualquiera.

## Cómo aplicar este esquema / crear el primer admin

Ver la guía paso a paso en [`docs/supabase-setup.md`](./supabase-setup.md) — crear
el proyecto, correr esta migración y crear el primer usuario ADMIN.
