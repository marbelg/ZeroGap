-- Antes de correr esto: si por alguna prueba manual anterior quedaron dos
-- perfiles con el mismo employee_code, este ALTER va a fallar. Para
-- revisar primero, correr:
--
--   select employee_code, count(*) from profiles
--   where employee_code is not null
--   group by employee_code having count(*) > 1;
--
-- Si sale alguna fila, hay que corregir esos duplicados a mano (Table
-- Editor -> profiles) antes de aplicar esta migración.

alter table profiles add constraint profiles_employee_code_key unique (employee_code);
