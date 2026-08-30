import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentWeekDays } from "@/lib/week";
import { WeekTracker } from "@/components/employee/week-tracker";

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
    .in("type", ["DESAYUNO", "ALMUERZO", "CENA"])
    .gte("date", weekDays[0].date)
    .lte("date", weekDays[6].date);

  const countsByDate: Record<string, number> = {};
  for (const day of weekDays) {
    const typesThatDay = new Set(
      (weekExpenses ?? []).filter((e) => e.date === day.date).map((e) => e.type),
    );
    countsByDate[day.date] = typesThatDay.size;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          ¿Qué quieres reportar?
        </h1>
        <p className="text-sm text-foreground-muted">
          Elige una categoría para registrar tu gasto.
        </p>
      </div>

      <WeekTracker weekDays={weekDays} countsByDate={countsByDate} />

      <div className="grid grid-cols-2 gap-3.5">
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="group flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm transition-transform active:scale-[0.97]"
          >
            <div
              className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${option.color}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-7"
              >
                {option.icon}
              </svg>
            </div>
            <span className="text-base font-semibold text-foreground">
              {option.label}
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/empleado/mis-gastos"
        className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface-muted px-5 py-4 text-sm font-medium text-foreground transition-colors hover:bg-border"
      >
        Ver mis gastos
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    </div>
  );
}
