import { createClient } from "@/lib/supabase/server";
import { enrichExpenses } from "@/lib/expenses";
import { EXPENSE_TYPE_LABEL } from "@/lib/expense-meta";
import { ExpenseStatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default async function MisGastosPage({
  searchParams,
}: {
  searchParams: Promise<{ creado?: string }>;
}) {
  const { creado } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user!.id)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  const enriched = await enrichExpenses(supabase, expenses ?? []);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Mis Gastos</h1>
        <p className="text-sm text-foreground-muted">Tu historial de reportes.</p>
      </div>

      {creado === "1" && (
        <p className="rounded-[var(--radius-md)] bg-success-soft px-4 py-3 text-sm text-success">
          Gasto enviado — queda en estado Reportado hasta que Administración lo revise.
        </p>
      )}

      {enriched.length === 0 ? (
        <Card className="px-6 py-14 text-center text-sm text-foreground-muted">
          Aún no has reportado ningún gasto.
        </Card>
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
                      : "Viaje reportado"
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
                              Inicio
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
                              Fin
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
                      Ver comprobante
                      {expense.photos.length > 1 ? ` (${expense.photos.length})` : ""}
                    </a>
                  )
                )}
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
        </div>
      )}
    </div>
  );
}
