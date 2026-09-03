import { MealExpenseForm } from "@/components/expense/meal-expense-form";
import { dict } from "@/i18n/dictionary";

export default async function DesayunoPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">
        {dict.employee.pageTitles.breakfast}
      </h1>
      <MealExpenseForm type="DESAYUNO" initialDate={date} />
    </div>
  );
}
