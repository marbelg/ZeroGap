-- Guarda la clave/PIN actual en texto plano para que el admin la pueda
-- consultar sin necesidad de restablecerla — los empleados son casi
-- analfabetos y dependen de que el admin les repita su PIN. Es un PIN
-- corto (no una contraseña real), pensado para consulta interna del
-- admin, no para exponerse públicamente.
alter table profiles add column current_pin text;
