import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { expenseTypeLabel } from "@/lib/expense-meta";
import { ExpenseStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { optionsForRole } from "@/lib/employee-categories";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import type { Expense, ExpenseType } from "@/types/database";

function ExpenseAmountLine({
  expense,
  T,
}: {
  expense: Expense;
  T: Dictionary["employee"]["dayDetail"];
}) {
  if (expense.type === "KILOMETRAJE" && Number(expense.amount) === 0) {
    return <p className="mt-1 text-sm text-foreground-muted">{T.tripReported}</p>;
  }
  if (expense.type === "HOSPEDAJE" && expense.nights) {
    return (
      <p className="mt-1 text-sm text-foreground-muted">
        {expense.nights} {T.nightsWord}
        {expense.nights === 1 ? "" : "s"} · {formatCurrency(expense.amount, expense.currency)}
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
  const dict = await getDictionary();
  const T = dict.employee.dayDetail;
  const EXPENSE_TYPE_LABEL = expenseTypeLabel(dict);

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
  const options = optionsForRole(role, dict);
  const allTypes = options.map((o) => o.type);
  const optionByType = new Map(options.map((o) => [o.type, o]));

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user!.id)
    .eq("date", date)
    .in("type", allTypes);

  const expensesByType = new Map<ExpenseType, Expense[]>();
  for (const e of expenses ?? []) {
    const list = expensesByType.get(e.type) ?? [];
    list.push(e);
    expensesByType.set(e.type, list);
  }

  // Total del día: dinero facturado, y noches si el rol reporta noches
  // (Hotel) — se suma sobre todo lo reportado, sin importar el estado.
  const dayExpenses = expenses ?? [];
  const totalAmount = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalNights = dayExpenses.reduce((sum, e) => sum + (e.nights ?? 0), 0);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <Link href="/empleado" className="text-xs font-medium text-foreground-muted">
          {T.back}
        </Link>
        <h1 className="mt-1 text-lg font-semibold capitalize text-foreground">
          {formatDate(date)}
        </h1>
        <p className="text-sm text-foreground-muted">{T.subtitle}</p>
      </div>

      {creado === "1" && (
        <p className="rounded-[var(--radius-md)] bg-success-soft px-4 py-3 text-sm text-success">
          {T.expenseSubmitted}
        </p>
      )}

      {dayExpenses.length > 0 && (
        <div className="rounded-[var(--radius-lg)] bg-brand-soft px-4 py-3 text-brand">
          <p className="text-xs font-medium">{T.totalOfDay}</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalAmount, "CRC")}</p>
          {totalNights > 0 && (
            <p className="mt-0.5 text-xs">
              {totalNights} {T.nightsWord}
              {totalNights === 1 ? "" : "s"} {T.nightsTotalSuffix}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {allTypes.map((type) => {
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
                      <ExpenseAmountLine expense={expense} T={T} />
                      <ExpenseStatusBadge status={expense.status} dict={dict} />
                    </div>
                    {expense.description && (
                      <p className="mt-1 text-xs text-foreground-muted">{expense.description}</p>
                    )}
                    {expense.status === "RECHAZADO" && expense.rejection_reason && (
                      <p className="mt-2 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-xs text-danger">
                        {T.rejectionReasonPrefix}
                        {expense.rejection_reason}
                      </p>
                    )}
                  </Card>
                ))}
                <Link
                  href={href}
                  className="rounded-full border border-dashed border-border px-4 py-2.5 text-center text-xs font-semibold text-foreground-muted transition-colors hover:border-brand hover:text-brand"
                >
                  {typeExpenses.length > 0 ? T.reportAnotherStay : T.report}
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
                  <ExpenseStatusBadge status={expense.status} dict={dict} />
                ) : (
                  <Link
                    href={href}
                    className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
                  >
                    {T.report}
                  </Link>
                )}
              </div>
              {expense && <ExpenseAmountLine expense={expense} T={T} />}
              {expense?.status === "RECHAZADO" && expense.rejection_reason && (
                <p className="mt-2 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-xs text-danger">
                  {T.rejectionReasonPrefix}
                  {expense.rejection_reason}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
