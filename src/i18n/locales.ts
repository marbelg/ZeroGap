export type Locale = "es" | "en" | "fr";

export interface LocaleMeta {
  code: Locale;
  label: string;
  flag: string;
  // Solo "es" tiene contenido real hoy. "en"/"fr" quedan visibles en el
  // selector pero deshabilitados hasta que exista una traducción real.
  enabled: boolean;
}

export const LOCALE_META: LocaleMeta[] = [
  { code: "es", label: "ES", flag: "🇨🇷", enabled: true },
  { code: "en", label: "EN", flag: "🇺🇸", enabled: true },
  { code: "fr", label: "FR", flag: "🇨🇦", enabled: true },
];

export const DEFAULT_LOCALE: Locale = "es";
