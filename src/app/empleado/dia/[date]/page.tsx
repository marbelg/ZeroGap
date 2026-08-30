import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EXPENSE_TYPE_LABEL } from "@/lib/expense-meta";
import { ExpenseStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { dailyTypesForRole, optionsForRole } from "@/lib/employee-categories";
import type { Expense, ExpenseType } from "@/types/database";

function ExpenseAmountLine({ expense }: { expense: Expense }) {
  if (expense.type === "KILOMETRAJE" && Number(expense.amount) === 0) {
    return <p className="mt-1 text-sm text-foreground-muted">Viaje reportado</p>;
  }
  if (expense.type === "HOSPEDAJE" && expense.nights) {
    return (
      <p className="mt-1 text-sm text-foreground-muted">
        {expense.nights} noche{expense.nights === 1 ? "" : "s"} ·{" "}
        {formatCurrency(expense.amount, expense.currency)}
      </p>
    );
  }
  return (
    <p className="mt-1 text-sm text-foreground-muted">
      {formatCurrency(expense.amount, expense.currency)}
    </p>
  );
}

export default async function DayDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ creado?: string }>;
}) {
  const { date } = await params;
  const { creado } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const role = profile?.role ?? "EMPLOYEE";
  const dailyTypes = dailyTypesForRole(role);
  const options = optionsForRole(role);
  const optionByType = new Map(options.map((o) => [o.type, o]));

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user!.id)
    .eq("date", date)
    .in("type", dailyTypes);

  const expensesByType = new Map<ExpenseType, Expense[]>();
  for (const e of expenses ?? []) {
    const list = expensesByType.get(e.type) ?? [];
    list.push(e);
    expensesByType.set(e.type, list);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <Link href="/empleado" className="text-xs font-medium text-foreground-muted">
          ← Volver
        </Link>
        <h1 className="mt-1 text-lg font-semibold capitalize text-foreground">
          {formatDate(date)}
        </h1>
        <p className="text-sm text-foreground-muted">Tus reportes de este día.</p>
      </div>

      {creado === "1" && (
        <p className="rounded-[var(--radius-md)] bg-success-soft px-4 py-3 text-sm text-success">
          Gasto enviado.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {dailyTypes.map((type) => {
          const option = optionByType.get(type);
          const typeExpenses = expensesByType.get(type) ?? [];
          const href = `${option?.href}?date=${date}`;

          // Categorías que permiten varias veces al día (ej. Hospedaje):
          // se lista cada reporte por separado y siempre se puede agregar
          // otro — nunca se "esconde" detrás de uno solo.
          if (option?.allowMultiple) {
            return (
              <div key={type} className="flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">{EXPENSE_TYPE_LABEL[type]}</p>
                {typeExpenses.map((expense) => (
                  <Card key={expense.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <ExpenseAmountLine expense={expense} />
                      <ExpenseStatusBadge status={expense.status} />
                    </div>
                    {expense.description && (
                      <p className="mt-1 text-xs text-foreground-muted">{expense.description}</p>
                    )}
                    {expense.status === "RECHAZADO" && expense.rejection_reason && (
                      <p className="mt-2 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-xs text-danger">
                        Motivo: {expense.rejection_reason}
                      </p>
                    )}
                  </Card>
                ))}
                <Link
                  href={href}
                  className="rounded-full border border-dashed border-border px-4 py-2.5 text-center text-xs font-semibold text-foreground-muted transition-colors hover:border-brand hover:text-brand"
                >
                  {typeExpenses.length > 0 ? "+ Reportar otra estadía" : "Reportar"}
                </Link>
              </div>
            );
          }

          const expense = typeExpenses[0];
          return (
            <Card key={type} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">{EXPENSE_TYPE_LABEL[type]}</span>
                {expense ? (
                  <ExpenseStatusBadge status={expense.status} />
                ) : (
                  <Link
                    href={href}
                    className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
                  >
                    Reportar
                  </Link>
                )}
              </div>
              {expense && <ExpenseAmountLine expense={expense} />}
              {expense?.status === "RECHAZADO" && expense.rejection_reason && (
                <p className="mt-2 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-xs text-danger">
                  Motivo: {expense.rejection_reason}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
