import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { weekDaysForOffset, weekRangeLabel } from "@/lib/week";
import type { Expense, Profile, UserRole } from "@/types/database";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador",
  EMPLOYEE: "Empleados",
  EMPLEADO_INDIRECTO: "Empleados no directos",
  CAJA_CHICA: "Caja chica",
  HOTEL: "Hoteles",
};

// Un cuadro independiente por tipo de usuario, en este orden, todos en la
// misma página (no en hojas separadas).
const ROLE_BLOCKS: UserRole[] = ["EMPLOYEE", "EMPLEADO_INDIRECTO", "CAJA_CHICA", "HOTEL"];

const MONEY_FORMAT = "#,##0";
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F2937" },
};
const BLOCK_TITLE_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE5E7EB" },
};

const HEADER_COLS = ["ID", "Nombre", "Cédula", "Cuenta bancaria", "Total"];
const COL_WIDTHS = [10, 28, 16, 34, 14];
const TOTAL_COL = HEADER_COLS.length;

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle" };
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
  sheet.columns = COL_WIDTHS.map((w) => ({ width: w }));

  for (const role of ROLE_BLOCKS) {
    const people = profileList
      .filter((p) => p.role === role)
      .sort((a, b) => a.first_name.localeCompare(b.first_name));

    const rows = people
      .map((person) => {
        const personExpenses = expensesByUser.get(person.id) ?? [];
        const total = personExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        return { person, total };
      })
      .filter((r) => r.total > 0);

    sheet.addRow([]);
    const titleRow = sheet.addRow([ROLE_LABEL[role]]);
    titleRow.font = { bold: true, size: 12 };
    titleRow.eachCell((cell) => {
      cell.fill = BLOCK_TITLE_FILL;
    });
    sheet.mergeCells(titleRow.number, 1, titleRow.number, TOTAL_COL);

    const headerRow = sheet.addRow(HEADER_COLS);
    styleHeaderRow(headerRow);

    if (rows.length === 0) {
      sheet.addRow(["Sin gastos aprobados en esta semana."]).font = {
        italic: true,
        color: { argb: "FF999999" },
      };
      continue;
    }

    let blockTotal = 0;
    for (const { person, total } of rows) {
      const name =
        role === "HOTEL" ? person.first_name : `${person.first_name} ${person.last_name}`.trim();
      const row = sheet.addRow([
        person.employee_code ?? "",
        name,
        person.cedula ?? "",
        person.bank_account ?? "",
        total,
      ]);
      row.getCell(TOTAL_COL).numFmt = MONEY_FORMAT;
      blockTotal += total;
    }

    const subtotalValues: (string | number)[] = new Array(HEADER_COLS.length).fill("");
    subtotalValues[1] = "Subtotal";
    subtotalValues[TOTAL_COL - 1] = blockTotal;
    const subtotalRow = sheet.addRow(subtotalValues);
    subtotalRow.font = { bold: true };
    subtotalRow.getCell(TOTAL_COL).numFmt = MONEY_FORMAT;
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="zerogap-control-viaticos.xlsx"`,
    },
  });
}
