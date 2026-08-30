import { MealExpenseForm } from "@/components/expense/meal-expense-form";

export default async function CenaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Reportar cena</h1>
      <MealExpenseForm type="CENA" initialDate={date} />
    </div>
  );
}
