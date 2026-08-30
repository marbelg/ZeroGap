import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Expense, ExpensePhoto, Mileage } from "@/types/database";
import { getReceiptSignedUrls } from "@/lib/supabase/storage";

export interface EnrichedExpense extends Expense {
  photos: (ExpensePhoto & { signedUrl: string | null })[];
  mileage: Mileage | null;
}

/**
 * Junta fotos y datos de kilometraje a una lista de gastos con consultas
 * separadas (en vez de un `select` con embeds de Supabase) — el tipado
 * `Database` de este proyecto no declara `Relationships` por tabla, así que
 * los embeds no resuelven bien los tipos. Esto es simple y confiable.
 */
export async function enrichExpenses(
  supabase: SupabaseClient<Database>,
  expenses: Expense[],
): Promise<EnrichedExpense[]> {
  if (expenses.length === 0) return [];

  const ids = expenses.map((e) => e.id);

  const [{ data: photos }, { data: mileageRows }] = await Promise.all([
    supabase.from("expense_photos").select("*").in("expense_id", ids),
    supabase.from("mileage").select("*").in("expense_id", ids),
  ]);

  const signedUrls = await getReceiptSignedUrls(
    supabase,
    (photos ?? []).map((p) => p.file_url),
  );

  const photosByExpense = new Map<string, (ExpensePhoto & { signedUrl: string | null })[]>();
  for (const photo of photos ?? []) {
    const list = photosByExpense.get(photo.expense_id) ?? [];
    list.push({ ...photo, signedUrl: signedUrls[photo.file_url] ?? null });
    photosByExpense.set(photo.expense_id, list);
  }

  const mileageByExpense = new Map<string, Mileage>();
  for (const m of mileageRows ?? []) {
    mileageByExpense.set(m.expense_id, m);
  }

  return expenses.map((expense) => ({
    ...expense,
    photos: photosByExpense.get(expense.id) ?? [],
    mileage: mileageByExpense.get(expense.id) ?? null,
  }));
}
