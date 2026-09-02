import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadReceiptPhoto } from "@/lib/supabase/storage";
import { weekDaysForOffset, weekRangeLabel } from "@/lib/week";
import { formatDate } from "@/lib/utils";
import { EXPENSE_TYPE_LABEL } from "@/lib/expense-meta";
import type { Expense, ExpensePhoto, PhotoType, Profile, UserRole } from "@/types/database";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador",
  EMPLOYEE: "Empleados",
  EMPLEADO_INDIRECTO: "Empleados no directos",
  CAJA_CHICA: "Caja chica",
  HOTEL: "Hoteles",
};

const PHOTO_TYPE_LABEL: Record<PhotoType, string> = {
  COMPROBANTE: "Comprobante",
  ODOMETRO_INICIAL: "Odómetro inicial",
  ODOMETRO_FINAL: "Odómetro final",
};

// ExcelJS solo soporta estos tres formatos para imágenes embebidas; el resto
// de comprobantes subidos son en la práctica siempre fotos jpeg de celular.
function imageExtension(path: string): "jpeg" | "png" | "gif" {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "png";
  if (ext === "gif") return "gif";
  return "jpeg";
}

// Tamaño fijo de cada imagen embebida y cuántas filas en blanco reservar
// debajo para que el siguiente contenido no se dibuje encima (las imágenes
// de ExcelJS flotan sobre la hoja, no empujan el alto de las filas).
const IMAGE_SIZE_PX = 200;
const IMAGE_ROW_SPAN = Math.ceil(IMAGE_SIZE_PX / 20) + 1;

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

  // Se descargan todas las imágenes en paralelo antes de armar la hoja —
  // ExcelJS necesita los bytes, no puede referenciar una URL.
  const photoBuffers = new Map<string, Buffer>();
  await Promise.all(
    photos.map(async (photo) => {
      const buffer = await downloadReceiptPhoto(supabase, photo.file_url);
      if (buffer) photoBuffers.set(photo.id, buffer);
    }),
  );

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

  const photosSheet = workbook.addWorksheet("Comprobantes");
  photosSheet.addRow(["Comprobantes de viáticos"]).font = { bold: true, size: 14 };
  photosSheet.addRow([`Semana del ${periodLabel}`]).font = {
    italic: true,
    color: { argb: "FF666666" },
  };
  photosSheet.columns = [{ width: 45 }];

  for (const role of ROLE_BLOCKS) {
    const people = profileList
      .filter((p) => p.role === role)
      .sort((a, b) => a.first_name.localeCompare(b.first_name))
      .filter((person) => (expensesByUser.get(person.id) ?? []).length > 0);

    if (people.length === 0) continue;

    photosSheet.addRow([]);
    const roleTitleRow = photosSheet.addRow([ROLE_LABEL[role]]);
    roleTitleRow.font = { bold: true, size: 12 };
    roleTitleRow.eachCell((cell) => {
      cell.fill = BLOCK_TITLE_FILL;
    });

    for (const person of people) {
      const name =
        role === "HOTEL" ? person.first_name : `${person.first_name} ${person.last_name}`.trim();
      photosSheet.addRow([name]).font = { bold: true, size: 11 };

      const personExpenses = (expensesByUser.get(person.id) ?? [])
        .slice()
        .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));

      const expensesByDate = new Map<string, Expense[]>();
      for (const e of personExpenses) {
        const list = expensesByDate.get(e.date) ?? [];
        list.push(e);
        expensesByDate.set(e.date, list);
      }

      for (const [date, dateExpenses] of expensesByDate) {
        photosSheet.addRow([formatDate(date)]).font = {
          italic: true,
          color: { argb: "FF666666" },
        };

        for (const expense of dateExpenses) {
          const amountLabel =
            expense.type === "KILOMETRAJE" && Number(expense.amount) === 0
              ? "Sin asignar"
              : `${expense.amount} ${expense.currency}`;
          photosSheet.addRow([`${EXPENSE_TYPE_LABEL[expense.type]} — ${amountLabel}`]).font = {
            bold: true,
            size: 10,
          };

          const expensePhotos = photosByExpense.get(expense.id) ?? [];
          if (expensePhotos.length === 0) {
            photosSheet.addRow(["Sin foto adjunta."]).font = {
              italic: true,
              color: { argb: "FF999999" },
            };
            continue;
          }

          for (const photo of expensePhotos) {
            photosSheet.addRow([PHOTO_TYPE_LABEL[photo.photo_type]]).font = {
              size: 9,
              color: { argb: "FF666666" },
            };

            const buffer = photoBuffers.get(photo.id);
            if (!buffer) {
              photosSheet.addRow(["No se pudo cargar la imagen."]).font = {
                italic: true,
                color: { argb: "FFB91C1C" },
              };
              continue;
            }

            // Cast necesario: los tipos de exceljs declaran su propio `Buffer`
            // ambiental que no es compatible con las adiciones de
            // ArrayBuffer redimensionable de TS/lib "esnext" — el valor en
            // tiempo de ejecución es un Buffer de Node normal y válido.
            const imageId = workbook.addImage({
              buffer: buffer as unknown as ExcelJS.Buffer,
              extension: imageExtension(photo.file_url),
            });
            photosSheet.addImage(imageId, {
              tl: { col: 0, row: photosSheet.rowCount },
              ext: { width: IMAGE_SIZE_PX, height: IMAGE_SIZE_PX },
            });
            for (let i = 0; i < IMAGE_ROW_SPAN; i++) photosSheet.addRow([]);
          }
        }
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="zerogap-control-viaticos.xlsx"`,
    },
  });
}
