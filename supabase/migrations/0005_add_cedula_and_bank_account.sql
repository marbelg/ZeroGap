-- Agrega cédula y número de cuenta bancaria al perfil del empleado.
alter table profiles add column cedula text;
alter table profiles add column bank_account text;
