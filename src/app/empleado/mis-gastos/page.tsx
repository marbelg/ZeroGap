import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { enrichExpenses } from "@/lib/expenses";
import { EXPENSE_TYPE_LABEL } from "@/lib/expense-meta";
import { ExpenseStatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { weekDaysForOffset, weekRangeLabel } from "@/lib/week";
import { PaymentKpi } from "@/components/employee/payment-kpi";
import { dict } from "@/i18n/dictionary";

const T = dict.employee.myExpenses;

// Rango de navegación acotado a 5 semanas hacia atrás y 5 hacia adelante —
// suficiente para revisar historial reciente sin dejar al empleado
// navegando sin límite.
const MIN_OFFSET = -5;
const MAX_OFFSET = 5;

export default async function MisGastosPage({
  searchParams,
}: {
  searchParams: Promise<{ creado?: string; offset?: string }>;
}) {
  const { creado, offset: offsetParam } = await searchParams;
  const offset = Math.min(
    MAX_OFFSET,
    Math.max(MIN_OFFSET, Math.trunc(Number(offsetParam ?? 0)) || 0),
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const weekDays = weekDaysForOffset(offset);
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user!.id)
    .gte("date", weekDays[0].date)
    .lte("date", weekDays[6].date)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  const enriched = await enrichExpenses(supabase, expenses ?? []);

  const lastWeekDays = weekDaysForOffset(-1);
  const { data: lastWeekApproved } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user!.id)
    .eq("status", "APROBADO")
    .gte("date", lastWeekDays[0].date)
    .lte("date", lastWeekDays[6].date)
    .order("date", { ascending: true });

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{T.title}</h1>
        <p className="text-sm text-foreground-muted">{T.subtitle}</p>
      </div>

      <PaymentKpi expenses={lastWeekApproved ?? []} />

      <div className="flex items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-border bg-surface p-3">
        {offset > MIN_OFFSET ? (
          <Link
            href={`?offset=${offset - 1}`}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            {T.prev}
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-xs font-medium text-foreground-muted/40">
            {T.prev}
          </span>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{weekRangeLabel(weekDays)}</p>
          {offset !== 0 && (
            <Link href="?offset=0" className="text-xs font-medium text-brand">
              {T.backToThisWeek}
            </Link>
          )}
        </div>
        {offset < MAX_OFFSET ? (
          <Link
            href={`?offset=${offset + 1}`}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            {T.next}
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-xs font-medium text-foreground-muted/40">
            {T.next}
          </span>
        )}
      </div>

      {creado === "1" && (
        <p className="rounded-[var(--radius-md)] bg-success-soft px-4 py-3 text-sm text-success">
          {T.submittedNotice}
        </p>
      )}

      {enriched.length === 0 ? (
        <Card className="px-6 py-14 text-center text-sm text-foreground-muted">{T.empty}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {enriched.map((expense) => (
            <Card key={expense.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {EXPENSE_TYPE_LABEL[expense.type]}
                  </p>
                  <p className="text-xs text-foreground-muted">{formatDate(expense.date)}</p>
                </div>
                <ExpenseStatusBadge status={expense.status} />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-lg font-semibold text-foreground">
                  {expense.type === "KILOMETRAJE"
                    ? expense.mileage
                      ? `${Number(expense.mileage.kilometers).toFixed(1)} km`
                      : dict.employee.dayDetail.tripReported
                    : formatCurrency(expense.amount, expense.currency)}
                </p>
                {expense.type === "KILOMETRAJE" ? (
                  <div className="flex shrink-0 gap-2">
                    {expense.photos
                      .filter((p) => p.photo_type === "ODOMETRO_INICIAL")
                      .map(
                        (p) =>
                          p.signedUrl && (
                            <a
                              key={p.id}
                              href={p.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-brand"
                            >
                              {T.mileageStart}
                            </a>
                          ),
                      )}
                    {expense.photos
                      .filter((p) => p.photo_type === "ODOMETRO_FINAL")
                      .map(
                        (p) =>
                          p.signedUrl && (
                            <a
                              key={p.id}
                              href={p.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-brand"
                            >
                              {T.mileageEnd}
                            </a>
                          ),
                      )}
                  </div>
                ) : (
                  expense.photos[0]?.signedUrl && (
                    <a
                      href={expense.photos[0].signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-semibold text-brand"
                    >
                      {T.viewReceipt}
                      {expense.photos.length > 1 ? ` (${expense.photos.length})` : ""}
                    </a>
                  )
                )}
              </div>

              {expense.type === "HOSPEDAJE" && expense.nights && (
                <p className="mt-1 text-xs text-foreground-muted">
                  {expense.nights} {dict.employee.dayDetail.nightsWord}
                  {expense.nights === 1 ? "" : "s"}
                </p>
              )}

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
        </div>
      )}
    </div>
  );
}
