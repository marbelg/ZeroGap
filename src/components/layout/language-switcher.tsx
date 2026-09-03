import { LOCALE_META } from "@/i18n/locales";
import { cn } from "@/lib/utils";

// Selector de idioma puramente visual por ahora: "es" es el único locale
// real (ver src/i18n/locales.ts), así que "en"/"fr" se muestran pero
// deshabilitados. El día que tengan contenido traducido de verdad, esto
// pasa a ser clickeable (cookie + server action para persistir la
// elección) — hoy sería un botón que no cambia nada, así que no se agrega.
export function LanguageSwitcher() {
  return (
    <div className="flex items-center gap-1">
      {LOCALE_META.map((locale) => (
        <span
          key={locale.code}
          title={locale.enabled ? undefined : "Próximamente"}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
            locale.enabled
              ? "bg-brand-soft text-brand"
              : "cursor-not-allowed text-foreground-muted/40",
          )}
        >
          <span aria-hidden>{locale.flag}</span>
          {locale.label}
        </span>
      ))}
    </div>
  );
}
