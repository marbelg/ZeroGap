import { MileageExpenseForm } from "@/components/expense/mileage-expense-form";

export default function KilometrajePage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Registrar kilometraje</h1>
      <MileageExpenseForm />
    </div>
  );
}
