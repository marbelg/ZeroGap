import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EXPENSE_TYPE_LABEL } from "@/lib/expense-meta";
import { ExpenseStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { dailyTypesForRole, optionsForRole } from "@/lib/employee-categories";
import type { ExpenseType } from "@/types/database";

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
  const typeHref: Partial<Record<ExpenseType, string>> = Object.fromEntries(
    optionsForRole(role).map((o) => [o.type, o.href]),
  );

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user!.id)
    .eq("date", date)
    .in("type", dailyTypes);

  const byType = new Map((expenses ?? []).map((e) => [e.type, e]));

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
          const expense = byType.get(type);
          return (
            <Card key={type} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">
                  {EXPENSE_TYPE_LABEL[type]}
                </span>
                {expense ? (
                  <ExpenseStatusBadge status={expense.status} />
                ) : (
                  <Link
                    href={`${typeHref[type]}?date=${date}`}
                    className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
                  >
                    Reportar
                  </Link>
                )}
              </div>
              {expense && (
                <p className="mt-1 text-sm text-foreground-muted">
                  {type === "KILOMETRAJE" && Number(expense.amount) === 0
                    ? "Viaje reportado"
                    : type === "HOSPEDAJE" && expense.nights
                      ? `${expense.nights} noche${expense.nights === 1 ? "" : "s"} · ${formatCurrency(expense.amount, expense.currency)}`
                      : formatCurrency(expense.amount, expense.currency)}
                </p>
              )}
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
