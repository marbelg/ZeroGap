import type { SupabaseClient } from "@supabase/supabase-js";
import { dateRangeForPreset, type DatePreset } from "@/lib/date-ranges";
import type { Database, Expense, ExpenseStatus, ExpenseType } from "@/types/database";

export interface ExpenseSearchParams {
  date?: string;
  from?: string;
  to?: string;
  employee?: string;
  type?: string;
  status?: string;
}

export async function getFilteredExpenses(
  supabase: SupabaseClient<Database>,
  sp: ExpenseSearchParams,
): Promise<Expense[]> {
  const preset = (sp.date as DatePreset) || "mes";
  const range = dateRangeForPreset(preset, { from: sp.from, to: sp.to });
  const employeeIds = sp.employee ? sp.employee.split(",").filter(Boolean) : [];

  let query = supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  if (range) query = query.gte("date", range.from).lte("date", range.to);
  if (employeeIds.length > 0) query = query.in("user_id", employeeIds);
  if (sp.type) query = query.eq("type", sp.type as ExpenseType);
  if (sp.status) query = query.eq("status", sp.status as ExpenseStatus);

  const { data } = await query;
  return data ?? [];
}
