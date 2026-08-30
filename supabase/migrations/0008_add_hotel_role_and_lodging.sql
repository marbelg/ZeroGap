-- Rol "Hotel": un perfil más (como Caja chica), reporta hospedajes en vez de
-- gastos de comida. Tarifa por noche propia de cada hotel, y "noches" en el
-- gasto para poder calcular el monto (noches x tarifa) en vez de escribirlo.
alter type user_role add value 'HOTEL';
alter type expense_type add value 'HOSPEDAJE';
alter table profiles add column nightly_rate numeric(12,2);
alter table expenses add column nights integer;
