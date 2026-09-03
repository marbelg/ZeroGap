"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./get-dictionary";
import { LOCALE_META, type Locale } from "./locales";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings, enabledLocalesFrom } from "@/lib/settings";

export async function setLocaleAction(locale: Locale) {
  const isKnown = LOCALE_META.some((l) => l.code === locale);
  if (!isKnown) return;

  // "es" siempre se puede elegir; en/fr dependen de lo que el admin activó
  // en Configuración — se valida contra la base, no contra un flag fijo.
  if (locale !== "es") {
    const supabase = await createClient();
    const settings = await getAppSettings(supabase);
    if (!enabledLocalesFrom(settings).includes(locale)) return;
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
