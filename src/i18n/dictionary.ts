import common from "./dictionaries/es/common.json";
import auth from "./dictionaries/es/auth.json";
import employee from "./dictionaries/es/employee.json";
import admin from "./dictionaries/es/admin.json";
import expenses from "./dictionaries/es/expenses.json";

// Solo existe el diccionario "es" por ahora (ver src/i18n/locales.ts). No se
// usa `import "server-only"` a propósito: como hoy es el mismo JSON para
// todos, no hay nada que "fugue" al cliente que valga la pena bloquear —
// cuando se agreguen en/fr de verdad, conviene revisar si conviene separar
// la carga por locale y añadir esa guarda.
export const dict = {
  common,
  auth,
  employee,
  admin,
  expenses,
};
