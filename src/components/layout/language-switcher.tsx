import { LOCALE_META, type Locale } from "@/i18n/locales";
import { setLocaleAction } from "@/i18n/actions";
import { FlagIcon } from "@/components/icons/flags";
import { cn } from "@/lib/utils";

// Cada bandera es su propio <form> con un Server Action — no hace falta
// JavaScript de cliente para que funcione. Al enviarse, el Server Action
// guarda la cookie de idioma y Next vuelve a renderizar la ruta actual con
// el nuevo diccionario.
export function LanguageSwitcher({
  currentLocale,
  enabledLocales,
}: {
  currentLocale: Locale;
  enabledLocales: Locale[];
}) {
  const visible = LOCALE_META.filter((locale) => enabledLocales.includes(locale.code));

  return (
    <div className="flex items-center gap-1">
      {visible.map((locale) => {
        const isActive = locale.code === currentLocale;
        return (
          <form key={locale.code} action={setLocaleAction.bind(null, locale.code)}>
            <button
              type="submit"
              disabled={isActive}
              aria-current={isActive}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors",
                isActive
                  ? "cursor-default bg-brand-soft text-brand"
                  : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <FlagIcon locale={locale.code} />
              {locale.label}
            </button>
          </form>
        );
      })}
    </div>
  );
}
