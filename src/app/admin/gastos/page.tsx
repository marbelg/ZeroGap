import { createClient } from "@/lib/supabase/server";
import { currentWeekDays } from "@/lib/week";
import { GastosEmployeeList, type EmployeeGastoStats } from "@/components/admin/gastos-employee-list";

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

  const statsByUser: Record<string, EmployeeGastoStats> = {};
  for (const e of weekExpenses ?? []) {
    const s = statsByUser[e.user_id] ?? { count: 0, pending: 0 };
    s.count++;
    if (e.status === "REPORTADO") s.pending++;
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

      <GastosEmployeeList employees={employees ?? []} statsByUser={statsByUser} />
    </div>
  );
}
