import { createClient } from "@/lib/supabase/server";
import { EmployeeManager } from "@/components/admin/employee-manager";

export default async function EmpleadosPage() {
  const supabase = await createClient();
  const { data: employees, error } = await supabase
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
        <p>Total filas recibidas: {employees?.length ?? 0}</p>
        {error && (
          <p className="mt-1 whitespace-pre-wrap text-danger">
            Error de la consulta: {JSON.stringify(error, null, 2)}
          </p>
        )}
        <table className="mt-2 w-full min-w-[500px] text-left">
          <thead>
            <tr className="text-foreground-muted">
              <th className="pr-3">created_at</th>
              <th className="pr-3">email</th>
              <th className="pr-3">role (raw)</th>
              <th>status</th>
            </tr>
          </thead>
          <tbody>
            {(employees ?? []).map((e) => (
              <tr key={e.id}>
                <td className="pr-3">{e.created_at}</td>
                <td className="pr-3">{e.email}</td>
                <td className="pr-3 font-mono">&quot;{e.role}&quot;</td>
                <td>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EmployeeManager employees={employees ?? []} />
    </div>
  );
}
