import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeBottomNav } from "@/components/employee/bottom-nav";
import { signOut } from "@/lib/auth-actions";

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
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-4">
        <div>
          <p className="text-xs text-foreground-muted">Hola,</p>
          <p className="text-sm font-semibold text-foreground">
            {profile?.first_name ?? "Empleado"}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs font-medium text-foreground-muted transition-colors hover:text-danger"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <main className="flex-1 px-5 py-6 pb-28">{children}</main>

      <EmployeeBottomNav />
    </div>
  );
}
