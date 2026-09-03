"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./get-dictionary";
import { LOCALE_META, type Locale } from "./locales";

export async function setLocaleAction(locale: Locale) {
  const meta = LOCALE_META.find((l) => l.code === locale);
  if (!meta?.enabled) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
