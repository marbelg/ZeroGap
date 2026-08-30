import { MealExpenseForm } from "@/components/expense/meal-expense-form";

export default function CenaPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Reportar cena</h1>
      <MealExpenseForm type="CENA" />
    </div>
  );
}
