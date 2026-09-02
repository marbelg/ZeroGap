import { cn, formatCurrency } from "@/lib/utils";
import type { AppSettings, Expense } from "@/types/database";

export function BudgetLine({
  label,
  spent,
  budget,
}: {
  label: string;
  spent: number;
  budget: number;
}) {
  if (budget <= 0) return null;
  const over = spent > budget;
  const pct = Math.min(100, (spent / budget) * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-foreground-muted">{label}</span>
        <span className={cn("font-medium", over ? "text-danger" : "text-foreground-muted")}>
          {formatCurrency(spent, "CRC")} de {formatCurrency(budget, "CRC")}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn("h-full rounded-full", over ? "bg-danger" : "bg-brand")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BudgetSummary({
  expenses,
  settings,
}: {
  expenses: Expense[];
  settings: AppSettings;
}) {
  const hasAnyBudget =
    settings.weekly_budget_total > 0 ||
    settings.weekly_budget_desayuno > 0 ||
    settings.weekly_budget_almuerzo > 0 ||
    settings.weekly_budget_cena > 0;

  if (!hasAnyBudget) return null;

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  // Desayuno/Almuerzo/Cena son un tope por día (un solo reporte), no semanal
  // — se compara el reporte más caro de la semana contra ese tope, no la
  // suma de los 5-7 reportes de la semana (eso siempre marcaría "excedido").
  const maxByType = (type: Expense["type"]) =>
    Math.max(0, ...expenses.filter((e) => e.type === type).map((e) => Number(e.amount)));

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-foreground">Presupuesto de esta semana</p>
      <BudgetLine label="Total (semana)" spent={total} budget={settings.weekly_budget_total} />
      <BudgetLine
        label="Desayuno (día más caro)"
        spent={maxByType("DESAYUNO")}
        budget={settings.weekly_budget_desayuno}
      />
      <BudgetLine
        label="Almuerzo (día más caro)"
        spent={maxByType("ALMUERZO")}
        budget={settings.weekly_budget_almuerzo}
      />
      <BudgetLine
        label="Cena (día más caro)"
        spent={maxByType("CENA")}
        budget={settings.weekly_budget_cena}
      />
    </div>
  );
}
