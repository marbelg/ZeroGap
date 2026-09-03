import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeBottomNav } from "@/components/employee/bottom-nav";
import { signOut } from "@/lib/auth-actions";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { dict } from "@/i18n/dictionary";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, employee_code")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-5 sm:py-4">
        <div>
          <p className="text-xs text-foreground-muted">{dict.employee.greeting}</p>
          <p className="text-sm font-semibold text-foreground">
            {profile ? `${profile.first_name} ${profile.last_name}` : dict.employee.defaultName}
            {profile?.employee_code && (
              <span className="ml-1.5 font-mono text-xs font-medium text-foreground-muted">
                ({profile.employee_code})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs font-medium text-foreground-muted transition-colors hover:text-danger"
            >
              {dict.common.actions.signOut}
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-28 sm:px-5 sm:py-6">{children}</main>

      <EmployeeBottomNav />
    </div>
  );
}
