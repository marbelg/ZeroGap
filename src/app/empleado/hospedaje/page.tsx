import { LodgingExpenseForm } from "@/components/expense/lodging-expense-form";
import { dict } from "@/i18n/dictionary";

export default async function HospedajePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">
        {dict.expenses.typeLabel.HOSPEDAJE}
      </h1>
      <LodgingExpenseForm initialDate={date} />
    </div>
  );
}
