import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryBarChart } from "@/components/dashboard/category-bar-chart";
import { RankingBarChart } from "@/components/dashboard/ranking-bar-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { BudgetLine } from "@/components/admin/budget-summary";
import { Card } from "@/components/ui/card";
import { EXPENSE_TYPE_COLOR, EXPENSE_TYPE_LABEL } from "@/lib/expense-meta";
import { getAppSettings } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import type { Expense, Mileage, Profile } from "@/types/database";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// El admin puede navegar meses atrás sin límite; hacia adelante no tiene
// sentido (no hay gastos futuros), así que se tope en el mes actual.
const MAX_OFFSET = 0;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const { offset: offsetParam } = await searchParams;
  const offset = Math.min(MAX_OFFSET, Math.trunc(Number(offsetParam ?? 0)) || 0);

  const supabase = await createClient();
  const now = new Date();

  const monthStart = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  // Mes actual: hasta hoy (no tiene sentido consultar fechas futuras). Un
  // mes pasado: el mes completo.
  const monthUpperBound = offset === 0 ? now : monthEnd;
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() + offset - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() + offset, 0);

  const [{ data: currentExpenses }, { data: prevExpenses }, { data: employees }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .gte("date", iso(monthStart))
        .lte("date", iso(monthUpperBound))
        .neq("status", "RECHAZADO"),
      supabase
        .from("expenses")
        .select("*")
        .gte("date", iso(prevMonthStart))
        .lte("date", iso(prevMonthEnd))
        .neq("status", "RECHAZADO"),
      supabase.from("profiles").select("*").neq("role", "ADMIN"),
    ]);

  const settings = await getAppSettings(supabase);

  const current = (currentExpenses ?? []) as Expense[];
  const previous = (prevExpenses ?? []) as Expense[];
  const employeeList = (employees ?? []) as Profile[];

  const mileageIds = current.filter((e) => e.type === "KILOMETRAJE").map((e) => e.id);
  const { data: mileageRows } = await supabase
    .from("mileage")
    .select("*")
    .in("expense_id", mileageIds.length > 0 ? mileageIds : ["00000000-0000-0000-0000-000000000000"]);
  const mileageByExpense = new Map<string, Mileage>((mileageRows ?? []).map((m) => [m.expense_id, m]));

  const moneySum = (list: Expense[]) => list.reduce((sum, e) => sum + Number(e.amount), 0);

  const totalActual = moneySum(current);
  const totalAnterior = moneySum(previous);
  const deltaPct = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : 0;

  const sumByType = (type: Expense["type"]) =>
    current.filter((e) => e.type === type).reduce((sum, e) => sum + Number(e.amount), 0);

  const totalKm = current
    .filter((e) => e.type === "KILOMETRAJE")
    .reduce((sum, e) => sum + Number(mileageByExpense.get(e.id)?.kilometers ?? 0), 0);

  const employeesWithExpenses = new Set(current.map((e) => e.user_id));
  const promedio =
    employeesWithExpenses.size > 0 ? totalActual / employeesWithExpenses.size : 0;

  // Presupuesto mensual por rol: caja chica (por tipo de gasto) y
  // empleados no directos (por rol del usuario, todas sus categorías).
  const cajaChicaSpent = sumByType("CAJA_CHICA");
  const indirectIds = new Set(
    employeeList.filter((e) => e.role === "EMPLEADO_INDIRECTO").map((e) => e.id),
  );
  const noDirectoSpent = current
    .filter((e) => indirectIds.has(e.user_id))
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const hasRoleBudget =
    settings.monthly_budget_caja_chica > 0 || settings.monthly_budget_no_directo > 0;

  // Tendencia: total por día del mes actual
  const byDay = new Map<string, number>();
  for (const e of current) {
    byDay.set(e.date, (byDay.get(e.date) ?? 0) + Number(e.amount));
  }
  const trendPoints = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      label: date.slice(8, 10) + "/" + date.slice(5, 7),
      value,
    }));

  // Ranking por empleado
  const byEmployee = new Map<string, number>();
  for (const e of current) {
    byEmployee.set(e.user_id, (byEmployee.get(e.user_id) ?? 0) + Number(e.amount));
  }
  const employeeById = new Map(employeeList.map((p) => [p.id, p]));
  const ranking = Array.from(byEmployee.entries())
    .map(([id, value]) => {
      const p = employeeById.get(id);
      return { id, value, label: p ? `${p.first_name} ${p.last_name}` : "—" };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Dos grupos con escalas muy distintas (caja chica/hospedaje son montos
  // grandes de una vez, la comida diaria es de a poco) — separados en dos
  // gráficos para que ninguno "aplaste" al otro visualmente.
  const dailyCategoryData = (
    ["DESAYUNO", "ALMUERZO", "CENA", "KILOMETRAJE", "REPARACION_LLANTAS", "PEAJE", "OTROS"] as const
  ).map((type) => ({
    label: EXPENSE_TYPE_LABEL[type],
    value: sumByType(type),
    color: EXPENSE_TYPE_COLOR[type],
  }));
  const lumpCategoryData = (["CAJA_CHICA", "HOSPEDAJE"] as const).map((type) => ({
    label: EXPENSE_TYPE_LABEL[type],
    value: sumByType(type),
    color: EXPENSE_TYPE_COLOR[type],
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-foreground-muted">
            Resumen de {monthStart.toLocaleDateString("es-CR", { month: "long", year: "numeric" })}.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`?offset=${offset - 1}`}
            aria-label="Mes anterior"
            className="flex size-9 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            ←
          </Link>
          {offset < MAX_OFFSET ? (
            <Link
              href={`?offset=${offset + 1}`}
              aria-label="Mes siguiente"
              className="flex size-9 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              →
            </Link>
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full border border-border text-foreground-muted/30">
              →
            </span>
          )}
          {offset !== 0 && (
            <Link
              href="/admin"
              className="ml-1 text-xs font-medium text-brand"
            >
              Mes actual
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="Gasto total"
          value={formatCurrency(totalActual, "CRC")}
          delta={{ pct: deltaPct, label: "vs. mes anterior" }}
        />
        <StatTile label="Desayunos" value={formatCurrency(sumByType("DESAYUNO"), "CRC")} />
        <StatTile label="Almuerzos" value={formatCurrency(sumByType("ALMUERZO"), "CRC")} />
        <StatTile label="Cenas" value={formatCurrency(sumByType("CENA"), "CRC")} />
        <StatTile label="Kilómetros" value={`${totalKm.toFixed(1)} km`} />
        <StatTile label="Promedio / empleado" value={formatCurrency(promedio, "CRC")} />
      </div>

      {hasRoleBudget && (
        <Card className="flex flex-col gap-2 p-3">
          <p className="text-sm font-semibold text-foreground">Presupuesto mensual por rol</p>
          <BudgetLine
            label="Caja chica"
            spent={cajaChicaSpent}
            budget={settings.monthly_budget_caja_chica}
          />
          <BudgetLine
            label="Empleados no directos"
            spent={noDirectoSpent}
            budget={settings.monthly_budget_no_directo}
          />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TrendChart
          title={`Tendencia de gastos (${monthStart.toLocaleDateString("es-CR", { month: "long" })})`}
          points={trendPoints}
        />
        <div className="flex flex-col gap-3">
          <CategoryBarChart title="Gastos diarios" data={dailyCategoryData} compact />
          <CategoryBarChart title="Caja chica y hospedaje" data={lumpCategoryData} compact />
        </div>
      </div>

      <RankingBarChart title="Ranking de empleados por gasto" data={ranking} />
    </div>
  );
}
