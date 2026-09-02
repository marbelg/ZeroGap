import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentWeekDays } from "@/lib/week";
import { WeekTracker } from "@/components/employee/week-tracker";
import { getAppSettings, dayOfWeekLabel, nextOccurrenceOf } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import { optionsForRole, dailyTypesForRole } from "@/lib/employee-categories";

export default async function EmployeeHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const role = profile?.role ?? "EMPLOYEE";
  const options = optionsForRole(role);
  const dailyTypes = dailyTypesForRole(role);

  const weekDays = currentWeekDays();
  const { data: weekExpenses } = await supabase
    .from("expenses")
    .select("date, type")
    .eq("user_id", user!.id)
    .in("type", dailyTypes)
    .gte("date", weekDays[0].date)
    .lte("date", weekDays[6].date);

  // Cuenta 1 por categoría reportada ese día (checklist), salvo las
  // categorías que permiten varias veces al día (ej. Hospedaje, un hotel
  // puede alojar a varios colaboradores) — ahí cuenta cada reporte.
  const optionByType = new Map(options.map((o) => [o.type, o]));
  const countsByDate: Record<string, number> = {};
  for (const day of weekDays) {
    const seenTypes = new Set<string>();
    let count = 0;
    for (const e of weekExpenses ?? []) {
      if (e.date !== day.date) continue;
      if (optionByType.get(e.type)?.allowMultiple) {
        count++;
      } else if (!seenTypes.has(e.type)) {
        seenTypes.add(e.type);
        count++;
      }
    }
    countsByDate[day.date] = count;
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
      <WeekTracker
        weekDays={weekDays}
        countsByDate={countsByDate}
        maxDaily={dailyTypes.length}
        categoriesLabel={options.map((o) => o.label).join(" · ")}
      />

      {lastWeekCount > 0 && (
        <div className="rounded-[var(--radius-md)] bg-brand-soft px-4 py-3 text-sm text-brand">
          <p>
            El{" "}
            <span className="font-semibold">
              {dayOfWeekLabel(settings.payment_day_of_week)} {paymentDate.getDate()}
            </span>{" "}
            se te pagan{" "}
            <span className="font-semibold">
              {formatCurrency(lastWeekApprovedTotal, "CRC")}
            </span>{" "}
            correspondientes a la semana pasada.
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
