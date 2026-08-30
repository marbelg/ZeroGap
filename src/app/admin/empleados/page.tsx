import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmployeeManager } from "@/components/admin/employee-manager";

export default async function EmpleadosPage() {
  const supabase = await createClient();
  const { data: employees, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // DEBUG: mismo pull pero con el cliente de servicio (se salta RLS por
  // completo) — si esta lista trae filas que la de arriba no trae, el
  // problema es de permisos (RLS); si trae lo mismo, la fila realmente no
  // se guardó en la base.
  const admin = createAdminClient();
  const { data: employeesAsAdmin, error: adminError } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground">Empleados</h1>
        <p className="text-sm text-foreground-muted">
          Crea, edita y administra el acceso de tu equipo.
        </p>
      </div>

      {/* DEBUG temporal — quitar una vez resuelto por qué caja chica / no
          directo no aparecen en la lista. Muestra el error crudo de la
          consulta (si lo hay) y los roles tal como llegan de la base. */}
      <div className="mb-4 overflow-x-auto rounded-[var(--radius-md)] border border-dashed border-warning bg-warning-soft p-3 text-xs text-foreground">
        <p className="mb-1 font-semibold text-warning">DEBUG (temporal)</p>
        <p>Con RLS (usuario admin logeado): {employees?.length ?? 0} filas</p>
        <p>Con cliente de servicio (sin RLS): {employeesAsAdmin?.length ?? 0} filas</p>
        {error && (
          <p className="mt-1 whitespace-pre-wrap text-danger">
            Error consulta RLS: {JSON.stringify(error, null, 2)}
          </p>
        )}
        {adminError && (
          <p className="mt-1 whitespace-pre-wrap text-danger">
            Error consulta admin: {JSON.stringify(adminError, null, 2)}
          </p>
        )}
        <table className="mt-2 w-full min-w-[600px] text-left">
          <thead>
            <tr className="text-foreground-muted">
              <th className="pr-3">created_at</th>
              <th className="pr-3">email</th>
              <th className="pr-3">role (raw)</th>
              <th className="pr-3">status</th>
              <th>¿en pull con RLS?</th>
            </tr>
          </thead>
          <tbody>
            {(employeesAsAdmin ?? []).map((e) => (
              <tr key={e.id}>
                <td className="pr-3">{e.created_at}</td>
                <td className="pr-3">{e.email}</td>
                <td className="pr-3 font-mono">&quot;{e.role}&quot;</td>
                <td className="pr-3">{e.status}</td>
                <td>
                  {(employees ?? []).some((x) => x.id === e.id) ? "sí" : "❌ NO"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EmployeeManager employees={employees ?? []} />
    </div>
  );
}
