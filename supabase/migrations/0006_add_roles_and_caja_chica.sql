-- Nuevos roles: empleado no directo (misma interfaz que empleado, solo
-- para identificarlo distinto) y caja chica (gasto genérico con
-- descripción, sin categorías fijas). Nuevo tipo de gasto para caja chica.
alter type user_role add value 'EMPLEADO_INDIRECTO';
alter type user_role add value 'CAJA_CHICA';
alter type expense_type add value 'CAJA_CHICA';
