import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentWeekDays, weekDaysForOffset } from "@/lib/week";
import { WeekTracker } from "@/components/employee/week-tracker";
import { getAppSettings, dayOfWeekLabel, nextOccurrenceOf } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import { optionsForRole, dailyTypesForRole } from "@/lib/employee-categories";

// Igual que en Mis Gastos: 5 semanas hacia atrás y hacia adelante.
const MIN_OFFSET = -5;
const MAX_OFFSET = 5;

export default async function EmployeeHomePage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const { offset: offsetParam } = await searchParams;
  const offset = Math.min(
    MAX_OFFSET,
    Math.max(MIN_OFFSET, Math.trunc(Number(offsetParam ?? 0)) || 0),
  );

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

  const weekDays = weekDaysForOffset(offset);
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
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <WeekTracker
        weekDays={weekDays}
        countsByDate={countsByDate}
        maxDaily={dailyTypes.length}
        paymentAmountLabel={
          lastWeekCount > 0 ? formatCurrency(lastWeekApprovedTotal, "CRC") : undefined
        }
        paymentDateLabel={
          lastWeekCount > 0
            ? `${dayOfWeekLabel(settings.payment_day_of_week)} ${paymentDate.getDate()}`
            : undefined
        }
        paymentPendingLabel={
          lastWeekPending > 0
            ? `${lastWeekPending} pendiente${lastWeekPending === 1 ? "" : "s"}`
            : undefined
        }
        offset={offset}
        minOffset={MIN_OFFSET}
        maxOffset={MAX_OFFSET}
      />

      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className={`group flex flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] bg-gradient-to-br p-2.5 text-white shadow-sm transition-transform active:scale-[0.97] ${option.color}`}
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
            <span className="text-center text-[11px] font-semibold leading-tight">
              {option.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
