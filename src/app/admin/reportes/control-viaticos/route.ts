import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  CONTROL_VIATICOS_ROLE_BLOCKS,
  CONTROL_VIATICOS_ROLE_LABEL,
  getLastWeekApprovedExpenses,
  requireAdminUser,
} from "@/lib/control-viaticos";

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
  const user = await requireAdminUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { periodLabel, profileList, expensesByUser } = await getLastWeekApprovedExpenses(supabase);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ZeroGap";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Control de viáticos");
  sheet.addRow(["Control de viáticos"]).font = { bold: true, size: 14 };
  sheet.addRow([`Semana del ${periodLabel}`]).font = { italic: true, color: { argb: "FF666666" } };
  sheet.columns = COL_WIDTHS.map((w) => ({ width: w }));

  for (const role of CONTROL_VIATICOS_ROLE_BLOCKS) {
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
    const titleRow = sheet.addRow([CONTROL_VIATICOS_ROLE_LABEL[role]]);
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
