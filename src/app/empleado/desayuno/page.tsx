import { MealExpenseForm } from "@/components/expense/meal-expense-form";

export default function DesayunoPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Reportar desayuno</h1>
      <MealExpenseForm type="DESAYUNO" />
    </div>
  );
}
