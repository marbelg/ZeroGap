import { MealExpenseForm } from "@/components/expense/meal-expense-form";

export default async function ReparacionLlantasPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Reparación de llantas</h1>
      <MealExpenseForm type="REPARACION_LLANTAS" initialDate={date} />
    </div>
  );
}
