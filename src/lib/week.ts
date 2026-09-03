import { dict } from "@/i18n/dictionary";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

/** Fecha más antigua que un empleado puede reportar: hasta 5 semanas atrás. */
export function minReportableDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 35);
  return toISODate(d);
}

export interface WeekDay {
  date: string; // YYYY-MM-DD
  dayName: string; // "Lun", "Mar"...
  dayNumber: number;
  isToday: boolean;
}

/** Lunes a domingo de la semana que contiene `reference` (hoy si se omite). */
export function currentWeekDays(reference: Date = new Date()): WeekDay[] {
  const day = reference.getDay(); // 0 = domingo
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(reference);
  monday.setDate(reference.getDate() - diffToMonday);

  const todayIso = toISODate(reference);
  const dayNames = dict.expenses.calendar.dayNamesShort;

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toISODate(d);
    return {
      date: iso,
      dayName: dayNames[i],
      dayNumber: d.getDate(),
      isToday: iso === todayIso,
    };
  });
}

/**
 * Días de la semana desplazada `offsetWeeks` semanas respecto a hoy (0 =
 * semana actual, -1 = semana anterior, 1 = semana siguiente). Usado para la
 * navegación de histórico hacia atrás/adelante en la vista de admin.
 */
export function weekDaysForOffset(offsetWeeks: number): WeekDay[] {
  const reference = new Date();
  reference.setDate(reference.getDate() + offsetWeeks * 7);
  return currentWeekDays(reference);
}

const MONTH_NAMES = dict.expenses.calendar.monthNamesShort;

/** Ej. "18 - 24 ago 2026" para el encabezado de un rango semanal. */
export function weekRangeLabel(weekDays: WeekDay[]): string {
  const first = weekDays[0];
  const last = weekDays[6];
  const [firstYear, firstMonth] = first.date.split("-");
  const [lastYear, lastMonth] = last.date.split("-");
  const lastLabel = `${last.dayNumber} ${MONTH_NAMES[Number(lastMonth) - 1]} ${lastYear}`;
  if (firstMonth === lastMonth && firstYear === lastYear) {
    return `${first.dayNumber} - ${lastLabel}`;
  }
  return `${first.dayNumber} ${MONTH_NAMES[Number(firstMonth) - 1]} - ${lastLabel}`;
}
