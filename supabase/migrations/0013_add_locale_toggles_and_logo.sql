-- Config de idiomas visibles (Español siempre activo, no tiene columna) y
-- logo de la empresa/app, ambos editables desde Configuración.
alter table app_settings
  add column locale_en_enabled boolean not null default true,
  add column locale_fr_enabled boolean not null default true,
  add column logo_url text;

-- La pantalla de Login (sin sesión iniciada) necesita leer logo_url y los
-- idiomas habilitados antes de autenticar. Nada en app_settings es sensible
-- (presupuestos, tarifa de km, idiomas, logo), así que se abre la lectura a
-- cualquiera en vez de solo a usuarios autenticados.
drop policy "app_settings_select_authenticated" on app_settings;
create policy "app_settings_select_all" on app_settings
  for select using (true);

-- ---------------------------------------------------------------------------
-- Storage: bucket público para el logo (a diferencia de "receipts", debe
-- poder verse sin sesión iniciada, ej. en la pantalla de Login).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

create policy "branding_admin_write" on storage.objects
  for insert with check (bucket_id = 'branding' and is_admin());

create policy "branding_admin_update" on storage.objects
  for update using (bucket_id = 'branding' and is_admin());

create policy "branding_admin_delete" on storage.objects
  for delete using (bucket_id = 'branding' and is_admin());
