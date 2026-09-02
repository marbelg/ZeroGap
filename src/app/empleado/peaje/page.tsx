import { MealExpenseForm } from "@/components/expense/meal-expense-form";

export default async function PeajePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Peaje</h1>
      <MealExpenseForm type="PEAJE" initialDate={date} />
    </div>
  );
}
