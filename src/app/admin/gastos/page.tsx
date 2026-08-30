import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { weekDaysForOffset, weekRangeLabel } from "@/lib/week";
import { GastosEmployeeList, type EmployeeGastoStats } from "@/components/admin/gastos-employee-list";

export default async function AdminGastosPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const { offset: offsetParam } = await searchParams;
  const offset = Math.trunc(Number(offsetParam ?? 0)) || 0;

  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "ADMIN")
    .order("first_name");

  const weekDays = weekDaysForOffset(offset);
  const { data: weekExpenses } = await supabase
    .from("expenses")
    .select("user_id, status")
    .gte("date", weekDays[0].date)
    .lte("date", weekDays[6].date);

  const statsByUser: Record<string, EmployeeGastoStats> = {};
  let approvedCount = 0;
  let pendingCount = 0;
  for (const e of weekExpenses ?? []) {
    const s = statsByUser[e.user_id] ?? { count: 0, pending: 0 };
    s.count++;
    if (e.status === "REPORTADO") {
      s.pending++;
      pendingCount++;
    } else if (e.status === "APROBADO") {
      approvedCount++;
    }
    statsByUser[e.user_id] = s;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Gastos</h1>
        <p className="text-sm text-foreground-muted">
          Elige un empleado para ver y administrar sus gastos.
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-border bg-surface p-3">
        <Link
          href={`?offset=${offset - 1}`}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          ← Anterior
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{weekRangeLabel(weekDays)}</p>
          {offset !== 0 && (
            <Link href="?offset=0" className="text-xs font-medium text-brand">
              Volver a esta semana
            </Link>
          )}
        </div>
        <Link
          href={`?offset=${offset + 1}`}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          Siguiente →
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <p className="text-xs font-medium text-foreground-muted">Aprobados</p>
          <p className="text-2xl font-semibold text-success">{approvedCount}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <p className="text-xs font-medium text-foreground-muted">Pendientes de aprobar</p>
          <p className="text-2xl font-semibold text-warning">{pendingCount}</p>
        </div>
      </div>

      <GastosEmployeeList employees={employees ?? []} statsByUser={statsByUser} />
    </div>
  );
}
