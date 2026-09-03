import type { ExpenseType } from "@/types/database";

export const EXPENSE_TYPE_LABEL: Record<ExpenseType, string> = {
  DESAYUNO: "Desayuno",
  ALMUERZO: "Almuerzo",
  CENA: "Cena",
  KILOMETRAJE: "Kilometraje",
  REPARACION_LLANTAS: "Reparación de llantas",
  CAJA_CHICA: "Caja chica",
  HOSPEDAJE: "Hospedaje",
  PEAJE: "Peaje",
  OTROS: "Otros",
};

// Paleta categórica fija validada (dataviz skill) — mismo orden siempre:
// slot 1 azul, 2 naranja, 3 aqua, 4 amarillo, 5 magenta. Como custom
// properties para que respondan a light/dark automáticamente (globals.css).
export const EXPENSE_TYPE_COLOR: Record<ExpenseType, string> = {
  DESAYUNO: "var(--chart-series-1)",
  ALMUERZO: "var(--chart-series-2)",
  CENA: "var(--chart-series-3)",
  KILOMETRAJE: "var(--chart-series-4)",
  REPARACION_LLANTAS: "var(--chart-series-5)",
  CAJA_CHICA: "var(--chart-series-6)",
  HOSPEDAJE: "var(--chart-series-7)",
  PEAJE: "var(--chart-series-8)",
  OTROS: "var(--chart-series-9)",
};
