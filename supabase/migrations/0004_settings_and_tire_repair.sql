-- Nueva categoría de gasto: reparación de llantas.
alter type expense_type add value 'REPARACION_LLANTAS';

-- Configuración global de la aplicación (una sola fila).
create table app_settings (
  id boolean primary key default true,
  constraint app_settings_singleton check (id),
  weekly_budget_total numeric(12, 2) not null default 0,
  weekly_budget_desayuno numeric(12, 2) not null default 0,
  weekly_budget_almuerzo numeric(12, 2) not null default 0,
  weekly_budget_cena numeric(12, 2) not null default 0,
  km_rate numeric(12, 2) not null default 0,
  -- 0 = domingo ... 6 = sábado (igual que JS Date#getDay()).
  payment_day_of_week smallint not null default 5,
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values (true);

create trigger app_settings_set_updated_at
  before update on app_settings
  for each row
  execute function set_updated_at();

alter table app_settings enable row level security;

-- Cualquier usuario autenticado puede leerla (el empleado necesita ver el
-- día de pago); solo un admin puede modificarla.
create policy "app_settings_select_authenticated" on app_settings
  for select using (auth.uid() is not null);

create policy "app_settings_admin_update" on app_settings
  for update using (is_admin());
