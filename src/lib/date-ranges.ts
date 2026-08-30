function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type DatePreset = "hoy" | "semana" | "mes" | "mes_anterior" | "custom" | "todos";

export function dateRangeForPreset(
  preset: DatePreset,
  custom?: { from?: string; to?: string },
): { from: string; to: string } | null {
  const now = new Date();

  switch (preset) {
    case "hoy": {
      const today = toISODate(now);
      return { from: today, to: today };
    }
    case "semana": {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      return { from: toISODate(monday), to: toISODate(now) };
    }
    case "mes": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toISODate(first), to: toISODate(now) };
    }
    case "mes_anterior": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toISODate(first), to: toISODate(last) };
    }
    case "custom":
      if (!custom?.from && !custom?.to) return null;
      return { from: custom?.from || "1970-01-01", to: custom?.to || toISODate(now) };
    case "todos":
    default:
      return null;
  }
}

export const DATE_PRESET_LABEL: Record<DatePreset, string> = {
  hoy: "Hoy",
  semana: "Esta semana",
  mes: "Este mes",
  mes_anterior: "Mes anterior",
  custom: "Rango personalizado",
  todos: "Todas las fechas",
};
