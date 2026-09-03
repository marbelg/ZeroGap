import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { dict } from "@/i18n/dictionary";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const settings = await getAppSettings(supabase);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">
          {dict.admin.pages.configuracion.title}
        </h1>
        <p className="text-sm text-foreground-muted">{dict.admin.pages.configuracion.subtitle}</p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
