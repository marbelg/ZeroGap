import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFilteredExpenses } from "@/lib/expense-filters";
import { dateRangeForPreset, type DatePreset } from "@/lib/date-ranges";
import type { Expense, Profile, UserRole } from "@/types/database";

const ROLE_SHEETS: { role: UserRole; title: string }[] = [
  { role: "EMPLOYEE", title: "Empleados" },
  { role: "EMPLEADO_INDIRECTO", title: "No directos" },
  { role: "CAJA_CHICA", title: "Caja chica" },
  { role: "HOTEL", title: "Hoteles" },
];

const MONEY_FORMAT = "#,##0";
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F2937" },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle" };
  });
}

function buildSheetRows(role: UserRole, people: Profile[], expensesByUser: Map<string, Expense[]>) {
  let headerCols: string[];
  let colWidths: number[];

  if (role === "HOTEL") {
    headerCols = ["ID", "Hotel", "Cédula", "Cuenta bancaria", "Noches", "Total"];
    colWidths = [10, 28, 16, 32, 10, 14];
  } else if (role === "CAJA_CHICA") {
    headerCols = ["ID", "Nombre", "Cédula", "Cuenta bancaria", "Total"];
    colWidths = [10, 26, 16, 32, 14];
  } else {
    headerCols = [
      "ID",
      "Nombre",
      "Cédula",
      "Cuenta bancaria",
      "Desayuno",
      "Almuerzo",
      "Cena",
      "Kilometraje",
      "Llantas",
      "Total",
    ];
    colWidths = [10, 26, 16, 32, 12, 12, 12, 12, 12, 14];
  }

  const dataRows: (string | number)[][] = [];
  let sheetTotal = 0;
  let personasConMonto = 0;

  for (const person of people) {
    const personExpenses = expensesByUser.get(person.id) ?? [];
    const total = personExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    if (total <= 0) continue;

    personasConMonto++;
    sheetTotal += total;
    const name =
      role === "HOTEL" ? person.first_name : `${person.first_name} ${person.last_name}`.trim();

    if (role === "HOTEL") {
      const nights = personExpenses.reduce((sum, e) => sum + (e.nights ?? 0), 0);
      dataRows.push([person.employee_code ?? "", name, person.cedula ?? "", person.bank_account ?? "", nights, total]);
    } else if (role === "CAJA_CHICA") {
      dataRows.push([person.employee_code ?? "", name, person.cedula ?? "", person.bank_account ?? "", total]);
    } else {
      const sumByType = (type: Expense["type"]) =>
        personExpenses.filter((e) => e.type === type).reduce((sum, e) => sum + Number(e.amount), 0);
      dataRows.push([
        person.employee_code ?? "",
        name,
        person.cedula ?? "",
        person.bank_account ?? "",
        sumByType("DESAYUNO"),
        sumByType("ALMUERZO"),
        sumByType("CENA"),
        sumByType("KILOMETRAJE"),
        sumByType("REPARACION_LLANTAS"),
        total,
      ]);
    }
  }

  return { headerCols, colWidths, dataRows, sheetTotal, personasConMonto };
}

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const datePreset = (searchParams.get("date") as DatePreset) || "mes";
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const range = dateRangeForPreset(datePreset, { from, to });

  // Solo gastos aprobados — un cierre de mes es lo que realmente se debe
  // pagar, no lo pendiente de revisar ni lo rechazado.
  const expenses = await getFilteredExpenses(supabase, {
    date: datePreset,
    from,
    to,
    status: "APROBADO",
  });

  const { data: profiles } = await supabase.from("profiles").select("*").neq("role", "ADMIN");
  const profileList = (profiles ?? []) as Profile[];
  const expensesByUser = new Map<string, Expense[]>();
  for (const e of expenses) {
    const list = expensesByUser.get(e.user_id) ?? [];
    list.push(e);
    expensesByUser.set(e.user_id, list);
  }

  const periodLabel = range ? `${range.from} a ${range.to}` : "Todo el histórico";

  // Se arma cada hoja de rol en memoria primero, para poder escribir el
  // Resumen con los totales ya calculados y que quede como primera hoja.
  const sheetsData = ROLE_SHEETS.map(({ role, title }) => {
    const people = profileList.filter((p) => p.role === role);
    return { role, title, ...buildSheetRows(role, people, expensesByUser) };
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ZeroGap";
  workbook.created = new Date();

  const resumen = workbook.addWorksheet("Resumen");
  resumen.addRow(["Cierre de mes"]).font = { bold: true, size: 14 };
  resumen.addRow([periodLabel]).font = { italic: true, color: { argb: "FF666666" } };
  resumen.addRow([]);
  resumen.columns = [{ width: 26 }, { width: 14 }, { width: 16 }];
  const resumenHeader = resumen.addRow(["Tipo de usuario", "Total", "Personas / hoteles"]);
  styleHeaderRow(resumenHeader);
  let grandTotal = 0;
  for (const s of sheetsData) {
    const row = resumen.addRow([s.title, s.sheetTotal, s.personasConMonto]);
    row.getCell(2).numFmt = MONEY_FORMAT;
    grandTotal += s.sheetTotal;
  }
  resumen.addRow([]);
  const grandTotalRow = resumen.addRow(["TOTAL GENERAL", grandTotal, ""]);
  grandTotalRow.font = { bold: true };
  grandTotalRow.getCell(2).numFmt = MONEY_FORMAT;

  for (const s of sheetsData) {
    const sheet = workbook.addWorksheet(s.title);
    sheet.addRow([`Cierre de mes — ${s.title}`]).font = { bold: true, size: 13 };
    sheet.addRow([periodLabel]).font = { italic: true, color: { argb: "FF666666" } };
    sheet.addRow([]);
    sheet.columns = s.colWidths.map((w) => ({ width: w }));

    const headerRow = sheet.addRow(s.headerCols);
    styleHeaderRow(headerRow);

    const moneyColsStart = s.role === "HOTEL" || s.role === "CAJA_CHICA" ? s.headerCols.length : 5;
    for (const dataRow of s.dataRows) {
      const addedRow = sheet.addRow(dataRow);
      addedRow.getCell(s.headerCols.length).font = { bold: true };
      for (let col = moneyColsStart; col <= s.headerCols.length; col++) {
        addedRow.getCell(col).numFmt = MONEY_FORMAT;
      }
    }

    sheet.addRow([]);
    const totalRowValues: (string | number)[] = new Array(s.headerCols.length).fill("");
    totalRowValues[1] = "TOTAL";
    totalRowValues[s.headerCols.length - 1] = s.sheetTotal;
    const totalRow = sheet.addRow(totalRowValues);
    totalRow.font = { bold: true };
    totalRow.getCell(s.headerCols.length).numFmt = MONEY_FORMAT;

    if (s.dataRows.length === 0) {
      sheet.addRow(["Sin gastos aprobados en este período."]).font = {
        italic: true,
        color: { argb: "FF999999" },
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="zerogap-cierre-de-mes.xlsx"`,
    },
  });
}
