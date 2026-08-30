import { LodgingExpenseForm } from "@/components/expense/lodging-expense-form";

export default async function HospedajePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-foreground">Hospedaje</h1>
      <LodgingExpenseForm initialDate={date} />
    </div>
  );
}
