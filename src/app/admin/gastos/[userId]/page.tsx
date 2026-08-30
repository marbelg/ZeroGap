import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enrichExpenses } from "@/lib/expenses";
import { weekDaysForOffset, weekRangeLabel } from "@/lib/week";
import { getAppSettings } from "@/lib/settings";
import { ExpenseManager } from "@/components/admin/expense-manager";
import { BudgetSummary } from "@/components/admin/budget-summary";

export default async function AdminUserGastosPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ offset?: string }>;
}) {
  const { userId } = await params;
  const { offset: offsetParam } = await searchParams;
  const offset = Math.trunc(Number(offsetParam ?? 0)) || 0;

  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!employee) notFound();

  const weekDays = weekDaysForOffset(offset);
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekDays[0].date)
    .lte("date", weekDays[6].date)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  const enriched = await enrichExpenses(supabase, expenses ?? []);
  const settings = await getAppSettings(supabase);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/gastos" className="text-xs font-medium text-foreground-muted">
        ← Volver a Gastos
      </Link>

      <div className="mb-4 mt-1 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="text-xs text-foreground-muted">
            {employee.employee_code ?? "—"} · {employee.email}
          </p>
        </div>
        <a
          href={`/admin/reportes/export?employee=${userId}&date=custom&from=${weekDays[0].date}&to=${weekDays[6].date}`}
          className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted"
        >
          Descargar reporte de la semana
        </a>
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

      <BudgetSummary expenses={enriched} settings={settings} />

      <ExpenseManager expenses={enriched} employees={[employee]} />
    </div>
  );
}
