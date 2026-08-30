import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppSettings, Database } from "@/types/database";

const FALLBACK_SETTINGS: AppSettings = {
  id: true,
  weekly_budget_total: 0,
  weekly_budget_desayuno: 0,
  weekly_budget_almuerzo: 0,
  weekly_budget_cena: 0,
  km_rate: 0,
  payment_day_of_week: 5,
  updated_at: "",
};

export async function getAppSettings(
  supabase: SupabaseClient<Database>,
): Promise<AppSettings> {
  const { data } = await supabase.from("app_settings").select("*").single();
  return data ?? FALLBACK_SETTINGS;
}

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function dayOfWeekLabel(day: number) {
  return DAY_NAMES[day] ?? DAY_NAMES[5];
}

/** Próxima fecha (hoy o futura) que cae en `dayOfWeek` (0=domingo..6=sábado). */
export function nextOccurrenceOf(dayOfWeek: number, reference: Date = new Date()): Date {
  const result = new Date(reference);
  const diff = (dayOfWeek - reference.getDay() + 7) % 7;
  result.setDate(reference.getDate() + diff);
  return result;
}
