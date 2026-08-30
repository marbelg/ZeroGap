import { MealExpenseForm } from "@/components/expense/meal-expense-form";

export default function AlmuerzoPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Reportar almuerzo</h1>
      <MealExpenseForm type="ALMUERZO" />
    </div>
  );
}
