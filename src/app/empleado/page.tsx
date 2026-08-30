import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentWeekDays } from "@/lib/week";
import { WeekTracker } from "@/components/employee/week-tracker";
import { getAppSettings, dayOfWeekLabel, nextOccurrenceOf } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";

// Íconos pensados para reconocerse a simple vista, sin leer el texto
// (taza de café, tenedor+cuchillo, luna, carro) — pensado para empleados
// con poca familiaridad con la lectura.
const options = [
  {
    href: "/empleado/desayuno",
    label: "Desayuno",
    color: "from-[#ffb74d] to-[#f57c1f]",
    icon: (
      <>
        <path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
        <path d="M16 10h1.5a2.5 2.5 0 1 1 0 5H16" />
        <path d="M8 3c0 .8-.8.9-.8 1.7S8 6.2 8 6.2M12 3c0 .8-.8.9-.8 1.7s.8 1.5.8 1.5" />
      </>
    ),
  },
  {
    href: "/empleado/almuerzo",
    label: "Almuerzo",
    color: "from-[#5ad48b] to-[#1f9e5c]",
    icon: (
      <>
        <path d="M7 2v7a1 1 0 0 0 2 0V2M8 2v20" />
        <path d="M16 2c-1.3 0-2 1.8-2 4s.7 4 2 4v12" />
      </>
    ),
  },
  {
    href: "/empleado/cena",
    label: "Cena",
    color: "from-[#7c8cf8] to-[#4a3cd6]",
    icon: (
      <>
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
        <path d="M17 3v2M18 4h-2" />
      </>
    ),
  },
  {
    href: "/empleado/kilometraje",
    label: "Kilometraje",
    color: "from-[#4dd0e1] to-[#0097a7]",
    icon: (
      <>
        <path d="M5 16v-4l2-5h10l2 5v4" />
        <path d="M3 16h18M5 12h14" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
      </>
    ),
  },
  {
    href: "/empleado/reparacion-llantas",
    label: "Llantas",
    color: "from-[#f2a1c2] to-[#d5528a]",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
      </>
    ),
  },
];

export default async function EmployeeHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const weekDays = currentWeekDays();
  const { data: weekExpenses } = await supabase
    .from("expenses")
    .select("date, type")
    .eq("user_id", user!.id)
    .in("type", ["DESAYUNO", "ALMUERZO", "CENA", "KILOMETRAJE"])
    .gte("date", weekDays[0].date)
    .lte("date", weekDays[6].date);

  const countsByDate: Record<string, number> = {};
  for (const day of weekDays) {
    const typesThatDay = new Set(
      (weekExpenses ?? []).filter((e) => e.date === day.date).map((e) => e.type),
    );
    countsByDate[day.date] = typesThatDay.size;
  }

  // Mini-dashboard: cuándo se pagan los gastos de la semana pasada. "Hoy - 7
  // días" siempre cae en la semana pasada, sin depender de parsear strings
  // de fecha (evita líos de huso horario).
  const settings = await getAppSettings(supabase);
  const lastWeekReference = new Date();
  lastWeekReference.setDate(lastWeekReference.getDate() - 7);
  const lastWeekDays = currentWeekDays(lastWeekReference);
  const { data: lastWeekExpenses } = await supabase
    .from("expenses")
    .select("amount, status")
    .eq("user_id", user!.id)
    .gte("date", lastWeekDays[0].date)
    .lte("date", lastWeekDays[6].date);
  const lastWeekCount = lastWeekExpenses?.length ?? 0;
  const lastWeekApproved = (lastWeekExpenses ?? []).filter((e) => e.status === "APROBADO");
  const lastWeekApprovedTotal = lastWeekApproved.reduce((sum, e) => sum + Number(e.amount), 0);
  const lastWeekPending = lastWeekCount - lastWeekApproved.length;
  const paymentDate = nextOccurrenceOf(settings.payment_day_of_week);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <WeekTracker weekDays={weekDays} countsByDate={countsByDate} />

      {lastWeekCount > 0 && (
        <div className="rounded-[var(--radius-md)] bg-brand-soft px-4 py-3 text-sm text-brand">
          <p>
            Se te pagan{" "}
            <span className="font-semibold">
              {formatCurrency(lastWeekApprovedTotal, "CRC")}
            </span>{" "}
            de la semana pasada el{" "}
            <span className="font-semibold">
              {dayOfWeekLabel(settings.payment_day_of_week)} {paymentDate.getDate()}
            </span>
            .
          </p>
          {lastWeekPending > 0 && (
            <p className="mt-1 text-xs text-brand/80">
              {lastWeekPending} reporte{lastWeekPending === 1 ? "" : "s"} de esa semana
              todavía no {lastWeekPending === 1 ? "está aprobado" : "están aprobados"} — el
              monto puede cambiar.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="group flex flex-col items-center gap-2.5 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-sm transition-transform active:scale-[0.97]"
          >
            <div
              className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${option.color}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                {option.icon}
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {option.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
