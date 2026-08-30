import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/nav";
import { signOut } from "@/lib/auth-actions";

export default async function AdminLayout({
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
    .select("first_name, last_name, role, employee_code")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") redirect("/empleado");

  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <aside className="border-b border-border bg-surface px-3 py-2.5 md:w-56 md:shrink-0 md:border-b-0 md:border-r md:px-3 md:py-6">
        <div className="mb-6 hidden items-center gap-2.5 px-2 md:flex">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d5cf6] to-[#4a3cd6] text-sm font-bold text-white">
            ZG
          </div>
          <span className="text-sm font-semibold text-foreground">ZeroGap Admin</span>
        </div>
        <AdminNav />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <p className="text-xs text-foreground-muted">Administración</p>
            <p className="text-sm font-semibold text-foreground">
              {profile?.first_name} {profile?.last_name}
              {profile?.employee_code && (
                <span className="ml-1.5 font-mono text-xs font-medium text-foreground-muted">
                  ({profile.employee_code})
                </span>
              )}
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

        <main className="flex-1 p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
