-- Presupuesto mensual (informativo) para los gastos de Caja chica y de
-- empleados no directos — a diferencia de los presupuestos semanales por
-- categoría de comida, estos se evalúan por mes y por rol completo.
alter table app_settings add column monthly_budget_caja_chica numeric(12,2) not null default 0;
alter table app_settings add column monthly_budget_no_directo numeric(12,2) not null default 0;
