-- Nueva categoría de gasto: peaje. Igual que reparación de llantas, solo
-- pide foto del comprobante y monto (sin descripción ni odómetro).
alter type expense_type add value 'PEAJE';
