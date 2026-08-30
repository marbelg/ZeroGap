import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const settings = await getAppSettings(supabase);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Configuración</h1>
        <p className="text-sm text-foreground-muted">
          Presupuestos, tarifa de kilometraje y día de pago.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
