import { getDictionary } from "@/i18n/get-dictionary";
import { LocaleProvider } from "@/i18n/locale-provider";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings, enabledLocalesFrom } from "@/lib/settings";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const dict = await getDictionary();
  const supabase = await createClient();
  const settings = await getAppSettings(supabase);

  return (
    <LocaleProvider dict={dict}>
      <LoginForm enabledLocales={enabledLocalesFrom(settings)} logoUrl={settings.logo_url} />
    </LocaleProvider>
  );
}
