import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Expense, ExpensePhoto, Profile, UserRole } from "@/types/database";
import { weekDaysForOffset, weekRangeLabel } from "@/lib/week";

// Un cuadro independiente por tipo de usuario, en este orden, todos en la
// misma página (no en hojas/carpetas separadas).
export const CONTROL_VIATICOS_ROLE_BLOCKS: UserRole[] = [
  "EMPLOYEE",
  "EMPLEADO_INDIRECTO",
  "CAJA_CHICA",
  "HOTEL",
];

export const CONTROL_VIATICOS_ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador",
  EMPLOYEE: "Empleados",
  EMPLEADO_INDIRECTO: "Empleados no directos",
  CAJA_CHICA: "Caja chica",
  HOTEL: "Hoteles",
};

export async function requireAdminUser(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") return null;
  return user;
}

// Siempre la semana anterior (lunes a domingo) — es un control fijo de pago
// semanal, no depende de los filtros de la pantalla de Reportes.
export async function getLastWeekApprovedExpenses(supabase: SupabaseClient<Database>) {
  const lastWeekDays = weekDaysForOffset(-1);
  const from = lastWeekDays[0].date;
  const to = lastWeekDays[6].date;
  const periodLabel = weekRangeLabel(lastWeekDays);

  const { data: expensesData } = await supabase
    .from("expenses")
    .select("*")
    .eq("status", "APROBADO")
    .gte("date", from)
    .lte("date", to);
  const expenses = (expensesData ?? []) as Expense[];

  const { data: profilesData } = await supabase.from("profiles").select("*").neq("role", "ADMIN");
  const profileList = (profilesData ?? []) as Profile[];

  const expensesByUser = new Map<string, Expense[]>();
  for (const e of expenses) {
    const list = expensesByUser.get(e.user_id) ?? [];
    list.push(e);
    expensesByUser.set(e.user_id, list);
  }

  return { from, to, periodLabel, expenses, profileList, expensesByUser };
}

export async function getPhotosByExpense(supabase: SupabaseClient<Database>, expenses: Expense[]) {
  const expenseIds = expenses.map((e) => e.id);
  const { data: photosData } =
    expenseIds.length > 0
      ? await supabase.from("expense_photos").select("*").in("expense_id", expenseIds)
      : { data: [] as ExpensePhoto[] };
  const photos = (photosData ?? []) as ExpensePhoto[];

  const photosByExpense = new Map<string, ExpensePhoto[]>();
  for (const photo of photos) {
    const list = photosByExpense.get(photo.expense_id) ?? [];
    list.push(photo);
    photosByExpense.set(photo.expense_id, list);
  }
  return photosByExpense;
}
