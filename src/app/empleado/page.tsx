import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentWeekDays } from "@/lib/week";
import { WeekTracker } from "@/components/employee/week-tracker";

const options = [
  {
    href: "/empleado/desayuno",
    label: "Desayuno",
    color: "from-[#ffb74d] to-[#f57c1f]",
    icon: (
      <path d="M4 10h16v2a8 8 0 0 1-8 8 8 8 0 0 1-8-8v-2ZM6 10a6 6 0 1 1 12 0M8 3v2M12 2v3M16 3v2" />
    ),
  },
  {
    href: "/empleado/almuerzo",
    label: "Almuerzo",
    color: "from-[#5ad48b] to-[#1f9e5c]",
    icon: (
      <>
        <path d="M12 3v7" />
        <path d="M9 3v4a3 3 0 0 0 6 0V3" />
        <path d="M17 3c1.5 2 1.5 6-1 8l1 10" />
        <path d="M8 21 9 14" />
      </>
    ),
  },
  {
    href: "/empleado/cena",
    label: "Cena",
    color: "from-[#7c8cf8] to-[#4a3cd6]",
    icon: (
      <>
        <path d="M12 2v6M8 5c0 4 8 4 8 0" />
        <path d="M12 11v11" />
        <path d="M7 22h10" />
      </>
    ),
  },
  {
    href: "/empleado/kilometraje",
    label: "Kilometraje",
    color: "from-[#4dd0e1] to-[#0097a7]",
    icon: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M6 16 16 6" />
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

      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="group flex flex-col items-start gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-transform active:scale-[0.97]"
          >
            <div
              className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${option.color}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
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
