export type Locale = "es" | "en" | "fr";

export interface LocaleMeta {
  code: Locale;
  label: string;
}

// Qué idiomas están realmente visibles para los usuarios (más allá de "es",
// siempre activo) lo decide el admin en Configuración — ver
// `enabledLocalesFrom` en `src/lib/settings.ts` y `setLocaleAction`.
export const LOCALE_META: LocaleMeta[] = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
];

export const DEFAULT_LOCALE: Locale = "es";
