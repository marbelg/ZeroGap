import { createClient } from "@/lib/supabase/server";
import { EmployeeManager } from "@/components/admin/employee-manager";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function EmpleadosPage() {
  const dict = await getDictionary();
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground">
          {dict.admin.pages.usuarios.title}
        </h1>
        <p className="text-sm text-foreground-muted">{dict.admin.pages.usuarios.subtitle}</p>
      </div>

      <EmployeeManager employees={employees ?? []} />
    </div>
  );
}
