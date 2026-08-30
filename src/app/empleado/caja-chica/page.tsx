import { MealExpenseForm } from "@/components/expense/meal-expense-form";

export default async function CajaChicaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Caja chica</h1>
      <MealExpenseForm type="CAJA_CHICA" initialDate={date} requireDescription />
    </div>
  );
}
