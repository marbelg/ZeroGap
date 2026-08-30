import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichExpenses } from "@/lib/expenses";
import { getFilteredExpenses } from "@/lib/expense-filters";
import { EXPENSE_TYPE_LABEL } from "@/lib/expense-meta";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sp = {
    date: searchParams.get("date") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    employee: searchParams.get("employee") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  };

  const expenses = await getFilteredExpenses(supabase, sp);
  const enriched = await enrichExpenses(supabase, expenses);

  const { data: employees } = await supabase.from("profiles").select("*");
  const employeeById = new Map((employees ?? []).map((e) => [e.id, e]));

  const rows = enriched.map((e) => {
    const employee = employeeById.get(e.user_id);
    return [
      e.date,
      employee ? `${employee.first_name} ${employee.last_name}` : "",
      employee?.cedula ?? "",
      employee?.bank_account ?? "",
      EXPENSE_TYPE_LABEL[e.type],
      e.type === "KILOMETRAJE" && Number(e.amount) === 0 ? "" : e.amount,
      e.currency,
      e.status,
      e.mileage ? Number(e.mileage.kilometers).toFixed(1) : "",
    ];
  });

  const csv = toCsv(
    ["Fecha", "Empleado", "Cédula", "Número de cuenta", "Categoría", "Monto", "Moneda", "Estado", "Kilometraje"],
    rows,
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zerogap-gastos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
