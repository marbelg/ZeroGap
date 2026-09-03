import { MealExpenseForm } from "@/components/expense/meal-expense-form";
import { dict } from "@/i18n/dictionary";

export default async function ReparacionLlantasPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">
        {dict.expenses.typeLabel.REPARACION_LLANTAS}
      </h1>
      <MealExpenseForm type="REPARACION_LLANTAS" initialDate={date} />
    </div>
  );
}
