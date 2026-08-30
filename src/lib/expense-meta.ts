import type { ExpenseType } from "@/types/database";

export const EXPENSE_TYPE_LABEL: Record<ExpenseType, string> = {
  DESAYUNO: "Desayuno",
  ALMUERZO: "Almuerzo",
  CENA: "Cena",
  KILOMETRAJE: "Kilometraje",
};

// Paleta categórica fija validada (dataviz skill) — mismo orden siempre:
// slot 1 azul, 2 naranja, 3 aqua, 4 amarillo. Como custom properties para
// que respondan a light/dark automáticamente (ver globals.css).
export const EXPENSE_TYPE_COLOR: Record<ExpenseType, string> = {
  DESAYUNO: "var(--chart-series-1)",
  ALMUERZO: "var(--chart-series-2)",
  CENA: "var(--chart-series-3)",
  KILOMETRAJE: "var(--chart-series-4)",
};
