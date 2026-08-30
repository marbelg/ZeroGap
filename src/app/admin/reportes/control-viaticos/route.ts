import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { weekDaysForOffset, weekRangeLabel } from "@/lib/week";
import type { Expense, Profile, UserRole } from "@/types/database";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador",
  EMPLOYEE: "Empleado",
  EMPLEADO_INDIRECTO: "Empleado no directo",
  CAJA_CHICA: "Caja chica",
  HOTEL: "Hotel",
};

// Orden fijo de tipo de usuario para agrupar visualmente sin usar hojas
// separadas — todo queda en una sola página.
const ROLE_ORDER: UserRole[] = ["EMPLOYEE", "EMPLEADO_INDIRECTO", "CAJA_CHICA", "HOTEL"];

const MONEY_FORMAT = "#,##0";
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F2937" },
};

const HEADER_COLS = [
  "Tipo de usuario",
  "ID",
  "Nombre",
  "Cédula",
  "Cuenta bancaria",
  "Desayuno",
  "Almuerzo",
  "Cena",
  "Kilometraje",
  "Llantas",
  "Caja chica",
  "Noches",
  "Hospedaje",
  "Total",
];
const COL_WIDTHS = [18, 10, 26, 16, 32, 12, 12, 12, 12, 12, 12, 10, 12, 14];
const FIRST_MONEY_COL = 6; // Desayuno
const TOTAL_COL = HEADER_COLS.length;

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  // Siempre la semana anterior (lunes a domingo) — es un control fijo de
  // pago semanal, no depende de los filtros de la pantalla de Reportes.
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
  const profileById = new Map(profileList.map((p) => [p.id, p]));

  const expensesByUser = new Map<string, Expense[]>();
  for (const e of expenses) {
    const list = expensesByUser.get(e.user_id) ?? [];
    list.push(e);
    expensesByUser.set(e.user_id, list);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ZeroGap";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Control de viáticos");
  sheet.addRow(["Control de viáticos"]).font = { bold: true, size: 14 };
  sheet.addRow([`Semana del ${periodLabel}`]).font = { italic: true, color: { argb: "FF666666" } };
  sheet.addRow([]);
  sheet.columns = COL_WIDTHS.map((w) => ({ width: w }));

  const headerRow = sheet.addRow(HEADER_COLS);
  styleHeaderRow(headerRow);

  const sumByType = (list: Expense[], type: Expense["type"]) =>
    list.filter((e) => e.type === type).reduce((sum, e) => sum + Number(e.amount), 0);

  let grandTotal = 0;
  const roleTotals = new Map<UserRole, { total: number; personas: number }>();

  const sortedUserIds = Array.from(expensesByUser.keys()).sort((a, b) => {
    const pa = profileById.get(a);
    const pb = profileById.get(b);
    const roleDiff = ROLE_ORDER.indexOf(pa?.role ?? "EMPLOYEE") - ROLE_ORDER.indexOf(pb?.role ?? "EMPLOYEE");
    if (roleDiff !== 0) return roleDiff;
    return (pa?.first_name ?? "").localeCompare(pb?.first_name ?? "");
  });

  for (const userId of sortedUserIds) {
    const person = profileById.get(userId);
    if (!person) continue;

    const personExpenses = expensesByUser.get(userId) ?? [];
    const total = personExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    if (total <= 0) continue;

    const name =
      person.role === "HOTEL" ? person.first_name : `${person.first_name} ${person.last_name}`.trim();
    const nights = personExpenses.reduce((sum, e) => sum + (e.nights ?? 0), 0);

    const row = sheet.addRow([
      ROLE_LABEL[person.role],
      person.employee_code ?? "",
      name,
      person.cedula ?? "",
      person.bank_account ?? "",
      sumByType(personExpenses, "DESAYUNO"),
      sumByType(personExpenses, "ALMUERZO"),
      sumByType(personExpenses, "CENA"),
      sumByType(personExpenses, "KILOMETRAJE"),
      sumByType(personExpenses, "REPARACION_LLANTAS"),
      sumByType(personExpenses, "CAJA_CHICA"),
      nights || "",
      sumByType(personExpenses, "HOSPEDAJE"),
      total,
    ]);
    row.getCell(TOTAL_COL).font = { bold: true };
    for (let col = FIRST_MONEY_COL; col <= TOTAL_COL; col++) {
      if (col === FIRST_MONEY_COL + 6) continue; // columna "Noches" no es dinero
      row.getCell(col).numFmt = MONEY_FORMAT;
    }

    grandTotal += total;
    const roleAgg = roleTotals.get(person.role) ?? { total: 0, personas: 0 };
    roleAgg.total += total;
    roleAgg.personas += 1;
    roleTotals.set(person.role, roleAgg);
  }

  if (sortedUserIds.length === 0) {
    sheet.addRow(["Sin gastos aprobados en esta semana."]).font = {
      italic: true,
      color: { argb: "FF999999" },
    };
  }

  sheet.addRow([]);
  const totalRowValues: (string | number)[] = new Array(HEADER_COLS.length).fill("");
  totalRowValues[2] = "TOTAL GENERAL";
  totalRowValues[TOTAL_COL - 1] = grandTotal;
  const totalRow = sheet.addRow(totalRowValues);
  totalRow.font = { bold: true };
  totalRow.getCell(TOTAL_COL).numFmt = MONEY_FORMAT;

  sheet.addRow([]);
  sheet.addRow(["Subtotales por tipo de usuario"]).font = { bold: true };
  const subHeaderRow = sheet.addRow(["Tipo de usuario", "Personas", "Total"]);
  styleHeaderRow(subHeaderRow);
  for (const role of ROLE_ORDER) {
    const agg = roleTotals.get(role);
    if (!agg) continue;
    const row = sheet.addRow([ROLE_LABEL[role], agg.personas, agg.total]);
    row.getCell(3).numFmt = MONEY_FORMAT;
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="zerogap-control-viaticos.xlsx"`,
    },
  });
}
