function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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
