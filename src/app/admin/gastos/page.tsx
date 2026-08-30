import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentWeekDays } from "@/lib/week";

export default async function AdminGastosPage() {
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "EMPLOYEE")
    .order("first_name");

  const weekDays = currentWeekDays();
  const { data: weekExpenses } = await supabase
    .from("expenses")
    .select("user_id, status")
    .gte("date", weekDays[0].date)
    .lte("date", weekDays[6].date);

  const statsByUser = new Map<string, { count: number; pending: number }>();
  for (const e of weekExpenses ?? []) {
    const s = statsByUser.get(e.user_id) ?? { count: 0, pending: 0 };
    s.count++;
    if (e.status === "REPORTADO") s.pending++;
    statsByUser.set(e.user_id, s);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground">Gastos</h1>
        <p className="text-sm text-foreground-muted">
          Elige un empleado para ver y administrar sus gastos.
        </p>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {(employees ?? []).length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-foreground-muted">
            Aún no hay empleados registrados.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {(employees ?? []).map((employee) => {
              const stats = statsByUser.get(employee.id);
              return (
                <Link
                  key={employee.id}
                  href={`/admin/gastos/${employee.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                >
                  <span className="shrink-0 rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                    {employee.employee_code ?? "—"}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {employee.first_name} {employee.last_name}
                  </span>
                  {stats?.pending ? (
                    <span className="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
                      {stats.pending} pendiente{stats.pending === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  <span className="shrink-0 text-xs text-foreground-muted">
                    {stats?.count ?? 0} esta semana
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4 shrink-0 text-foreground-muted"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
