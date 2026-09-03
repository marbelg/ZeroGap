import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import { esDictionary } from "./dictionaries/es";
import { enDictionary } from "./dictionaries/en";
import { frDictionary } from "./dictionaries/fr";

export const LOCALE_COOKIE = "zerogap_locale";

const DICTIONARIES = {
  es: esDictionary,
  en: enDictionary,
  fr: frDictionary,
} as const;

export type Dictionary = (typeof DICTIONARIES)[Locale] & { locale: Locale };

// Diccionario español fijo, sin depender de la cookie de idioma — para los
// documentos contables (CSV, control de viáticos) que deben quedar siempre
// en español sin importar el idioma que tenga elegido el admin en la UI.
export const ES_DICTIONARY: Dictionary = { ...esDictionary, locale: "es" };

function isLocale(value: string | undefined): value is Locale {
  return value === "es" || value === "en" || value === "fr";
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return { ...DICTIONARIES[locale], locale };
}
