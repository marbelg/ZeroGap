-- ZeroGap — esquema inicial (Fase 1: autenticación y usuarios,
-- + tablas base de gastos/kilometraje/fotos para fases siguientes)

create type user_role as enum ('ADMIN', 'EMPLOYEE');
create type user_status as enum ('ACTIVE', 'INACTIVE');
create type expense_type as enum ('DESAYUNO', 'ALMUERZO', 'CENA', 'KILOMETRAJE');
create type expense_status as enum ('REPORTADO', 'APROBADO', 'RECHAZADO');
create type currency_code as enum ('USD', 'CRC');
create type photo_type as enum ('COMPROBANTE', 'ODOMETRO_INICIAL', 'ODOMETRO_FINAL');

-- ---------------------------------------------------------------------------
-- PROFILES (extiende auth.users; 1:1 por id)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  role user_role not null default 'EMPLOYEE',
  status user_status not null default 'ACTIVE',
  department text,
  position text,
  employee_code text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- EXPENSES
-- ---------------------------------------------------------------------------
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type expense_type not null,
  date date not null,
  time time not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency currency_code not null,
  description text,
  status expense_status not null default 'REPORTADO',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_user_id_idx on expenses (user_id);
create index expenses_date_idx on expenses (date);
create index expenses_status_idx on expenses (status);

-- ---------------------------------------------------------------------------
-- MILEAGE (1:1 con un expense de tipo KILOMETRAJE)
-- ---------------------------------------------------------------------------
create table mileage (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null unique references expenses (id) on delete cascade,
  start_location text not null,
  end_location text not null,
  start_time time not null,
  end_time time not null,
  initial_odometer numeric(10, 2) not null,
  final_odometer numeric(10, 2) not null,
  kilometers numeric(10, 2) generated always as (final_odometer - initial_odometer) stored
);

-- ---------------------------------------------------------------------------
-- EXPENSE_PHOTOS
-- ---------------------------------------------------------------------------
create table expense_photos (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses (id) on delete cascade,
  photo_type photo_type not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

create index expense_photos_expense_id_idx on expense_photos (expense_id);

-- ---------------------------------------------------------------------------
-- updated_at automático en expenses
-- ---------------------------------------------------------------------------
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expenses_set_updated_at
  before update on expenses
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: is_admin() — security definer para evitar recursión en las
-- políticas RLS de `profiles` (una policy sobre profiles no puede hacer
-- un select directo a profiles sin recursión infinita).
-- ---------------------------------------------------------------------------
create function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table expenses enable row level security;
alter table mileage enable row level security;
alter table expense_photos enable row level security;

-- profiles: un empleado ve/edita solo su propio perfil; un admin ve/edita todos.
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles_update_own_or_admin" on profiles
  for update using (id = auth.uid() or is_admin());

create policy "profiles_admin_insert" on profiles
  for insert with check (is_admin());

create policy "profiles_admin_delete" on profiles
  for delete using (is_admin());

-- expenses: un empleado ve/crea solo sus propios gastos; un admin ve/gestiona todos.
create policy "expenses_select_own_or_admin" on expenses
  for select using (user_id = auth.uid() or is_admin());

create policy "expenses_insert_own_or_admin" on expenses
  for insert with check (user_id = auth.uid() or is_admin());

create policy "expenses_update_own_or_admin" on expenses
  for update using (user_id = auth.uid() or is_admin());

create policy "expenses_delete_admin_only" on expenses
  for delete using (is_admin());

-- mileage: sigue el permiso del expense asociado.
create policy "mileage_select_own_or_admin" on mileage
  for select using (
    exists (
      select 1 from expenses
      where expenses.id = mileage.expense_id
        and (expenses.user_id = auth.uid() or is_admin())
    )
  );

create policy "mileage_insert_own_or_admin" on mileage
  for insert with check (
    exists (
      select 1 from expenses
      where expenses.id = mileage.expense_id
        and (expenses.user_id = auth.uid() or is_admin())
    )
  );

create policy "mileage_update_own_or_admin" on mileage
  for update using (
    exists (
      select 1 from expenses
      where expenses.id = mileage.expense_id
        and (expenses.user_id = auth.uid() or is_admin())
    )
  );

-- expense_photos: sigue el permiso del expense asociado.
create policy "expense_photos_select_own_or_admin" on expense_photos
  for select using (
    exists (
      select 1 from expenses
      where expenses.id = expense_photos.expense_id
        and (expenses.user_id = auth.uid() or is_admin())
    )
  );

create policy "expense_photos_insert_own_or_admin" on expense_photos
  for insert with check (
    exists (
      select 1 from expenses
      where expenses.id = expense_photos.expense_id
        and (expenses.user_id = auth.uid() or is_admin())
    )
  );

create policy "expense_photos_delete_admin_only" on expense_photos
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- Storage: bucket privado para comprobantes y fotos de odómetro.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "receipts_select_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'receipts'
    and (owner = auth.uid() or is_admin())
  );

create policy "receipts_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and owner = auth.uid()
  );

create policy "receipts_delete_admin_only" on storage.objects
  for delete using (bucket_id = 'receipts' and is_admin());
