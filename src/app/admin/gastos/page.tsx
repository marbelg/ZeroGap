import { createClient } from "@/lib/supabase/server";
import { enrichExpenses } from "@/lib/expenses";
import { getFilteredExpenses, type ExpenseSearchParams } from "@/lib/expense-filters";
import { ExpenseManager } from "@/components/admin/expense-manager";
import { ExpenseFilterBar } from "@/components/admin/expense-filter-bar";

export default async function AdminGastosPage({
  searchParams,
}: {
  searchParams: Promise<ExpenseSearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const expenses = await getFilteredExpenses(supabase, sp);
  const enriched = await enrichExpenses(supabase, expenses);

  const { data: employees } = await supabase
    .from("profiles")
    .select("*")
    .order("first_name");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground">Gastos</h1>
        <p className="text-sm text-foreground-muted">
          Revisa, aprueba, rechaza y administra los gastos de tu equipo.
        </p>
      </div>

      <ExpenseFilterBar sp={sp} employees={employees ?? []} clearHref="/admin/gastos" />

      <ExpenseManager expenses={enriched} employees={employees ?? []} />
    </div>
  );
}
