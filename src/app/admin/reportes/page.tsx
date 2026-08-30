import { createClient } from "@/lib/supabase/server";
import { enrichExpenses } from "@/lib/expenses";
import { getFilteredExpenses, type ExpenseSearchParams } from "@/lib/expense-filters";
import { ExpenseFilterBar } from "@/components/admin/expense-filter-bar";
import { EXPENSE_TYPE_LABEL } from "@/lib/expense-meta";
import { ExpenseStatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<ExpenseSearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const expenses = await getFilteredExpenses(supabase, sp);
  const enriched = await enrichExpenses(supabase, expenses);

  const { data: employees } = await supabase.from("profiles").select("*").order("first_name");
  const employeeById = new Map((employees ?? []).map((e) => [e.id, e]));

  const query = new URLSearchParams();
  if (sp.date) query.set("date", sp.date);
  if (sp.from) query.set("from", sp.from);
  if (sp.to) query.set("to", sp.to);
  if (sp.employee) query.set("employee", sp.employee);
  if (sp.type) query.set("type", sp.type);
  if (sp.status) query.set("status", sp.status);

  const total = enriched.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Reportes</h1>
          <p className="text-sm text-foreground-muted">
            Filtra por mes, empleado, categoría o estado y exporta a CSV.
          </p>
        </div>
        <a
          href={`/admin/reportes/export?${query.toString()}`}
          className="flex h-10 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          Descargar CSV
        </a>
      </div>

      <ExpenseFilterBar sp={sp} employees={employees ?? []} clearHref="/admin/reportes" />

      <Card className="mb-4 p-4">
        <p className="text-sm text-foreground-muted">
          {enriched.length} gasto{enriched.length === 1 ? "" : "s"} · Total:{" "}
          <span className="font-semibold text-foreground">{formatCurrency(total, "CRC")}</span>
        </p>
      </Card>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-foreground-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
                <th className="px-4 py-2.5 font-medium">Empleado</th>
                <th className="px-4 py-2.5 font-medium">Categoría</th>
                <th className="px-4 py-2.5 font-medium">Monto</th>
                <th className="px-4 py-2.5 font-medium">Km</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {enriched.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-foreground-muted">
                    No hay gastos con estos filtros.
                  </td>
                </tr>
              )}
              {enriched.map((e) => {
                const employee = employeeById.get(e.user_id);
                return (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-foreground-muted">{formatDate(e.date)}</td>
                    <td className="px-4 py-2.5 text-foreground">
                      {employee ? `${employee.first_name} ${employee.last_name}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">
                      {EXPENSE_TYPE_LABEL[e.type]}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {e.type === "KILOMETRAJE" && Number(e.amount) === 0
                        ? "Sin asignar"
                        : formatCurrency(e.amount, e.currency)}
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">
                      {e.mileage ? Number(e.mileage.kilometers).toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <ExpenseStatusBadge status={e.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
