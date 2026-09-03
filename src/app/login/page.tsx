import { getDictionary } from "@/i18n/get-dictionary";
import { LocaleProvider } from "@/i18n/locale-provider";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const dict = await getDictionary();

  return (
    <LocaleProvider dict={dict}>
      <LoginForm />
    </LocaleProvider>
  );
}
