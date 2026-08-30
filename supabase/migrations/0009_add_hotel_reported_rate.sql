-- El hotel también puede indicar la tarifa que aplicó en cada estadía —
-- si difiere de la tarifa que tiene configurada el admin en su perfil, se
-- le muestra una alerta al admin al revisar ese gasto.
alter table expenses add column reported_rate numeric(12,2);
