import { MealExpenseForm } from "@/components/expense/meal-expense-form";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function CajaChicaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const dict = await getDictionary();
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">
        {dict.expenses.typeLabel.CAJA_CHICA}
      </h1>
      <MealExpenseForm type="CAJA_CHICA" initialDate={date} requireDescription />
    </div>
  );
}
