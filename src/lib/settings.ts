import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppSettings, Database } from "@/types/database";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/locales";

const FALLBACK_SETTINGS: AppSettings = {
  id: true,
  weekly_budget_total: 0,
  weekly_budget_desayuno: 0,
  weekly_budget_almuerzo: 0,
  weekly_budget_cena: 0,
  km_rate: 0,
  payment_day_of_week: 5,
  monthly_budget_caja_chica: 0,
  monthly_budget_no_directo: 0,
  locale_en_enabled: true,
  locale_fr_enabled: true,
  logo_url: null,
  updated_at: "",
};

export async function getAppSettings(
  supabase: SupabaseClient<Database>,
): Promise<AppSettings> {
  const { data } = await supabase.from("app_settings").select("*").single();
  return data ?? FALLBACK_SETTINGS;
}

// Español siempre está disponible (es el DEFAULT_LOCALE y la única
// traducción completa); inglés/francés dependen de lo que el admin activó
// en Configuración.
export function enabledLocalesFrom(settings: AppSettings): Locale[] {
  const locales: Locale[] = ["es"];
  if (settings.locale_en_enabled) locales.push("en");
  if (settings.locale_fr_enabled) locales.push("fr");
  return locales;
}

export function dayOfWeekLabel(dict: Dictionary, day: number) {
  const dayNames = dict.expenses.calendar.dayNamesFull;
  return dayNames[day] ?? dayNames[5];
}

/** Próxima fecha (hoy o futura) que cae en `dayOfWeek` (0=domingo..6=sábado). */
export function nextOccurrenceOf(dayOfWeek: number, reference: Date = new Date()): Date {
  const result = new Date(reference);
  const diff = (dayOfWeek - reference.getDay() + 7) % 7;
  result.setDate(reference.getDate() + diff);
  return result;
}
