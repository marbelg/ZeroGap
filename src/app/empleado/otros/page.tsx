import { MealExpenseForm } from "@/components/expense/meal-expense-form";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function OtrosPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const dict = await getDictionary();
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">
        {dict.expenses.typeLabel.OTROS}
      </h1>
      <MealExpenseForm type="OTROS" initialDate={date} requireDescription />
    </div>
  );
}
