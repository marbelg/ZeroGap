import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentWeekDays, weekDaysForOffset } from "@/lib/week";
import { WeekTracker } from "@/components/employee/week-tracker";
import { StatusKpiRow, type KpiDef } from "@/components/employee/status-kpi-row";
import { getAppSettings, dayOfWeekLabel, nextOccurrenceOf } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import { optionsForRole, dailyTypesForRole } from "@/lib/employee-categories";
import { getDictionary } from "@/i18n/get-dictionary";

// Igual que en Mis Gastos: 5 semanas hacia atrás y hacia adelante.
const MIN_OFFSET = -5;
const MAX_OFFSET = 5;

const CHECK_ICON = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.2 2.2L15.5 9.5" />
  </>
);

const CLOCK_ICON = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </>
);

const REJECTED_ICON = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
  </>
);

const REPORTED_ICON = (
  <>
    <path d="M7 3h7l4 4v14H7Z" />
    <path d="M9 11h6M9 15h6" />
  </>
);

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

  const dict = await getDictionary();
  const K = dict.employee.statusKpi;

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
  const options = optionsForRole(role, dict);
  const dailyTypes = dailyTypesForRole(role);

  const weekDays = weekDaysForOffset(dict, offset);
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

  // KPIs de pago: Aprobados/Pendientes/Rechazados son siempre de la semana
  // pasada (lo que se paga el día de pago configurado); Reportados es de la
  // semana EN CURSO (para que el empleado vea cuánto lleva reportado antes
  // de que se cierre la semana) — a propósito, dos rangos de fecha
  // distintos en la misma fila de KPIs.
  const settings = await getAppSettings(supabase);
  const lastWeekReference = new Date();
  lastWeekReference.setDate(lastWeekReference.getDate() - 7);
  const lastWeekDays = currentWeekDays(dict, lastWeekReference);
  const { data: lastWeekExpenses } = await supabase
    .from("expenses")
    .select("id, type, date, amount, currency, status, rejection_reason")
    .eq("user_id", user!.id)
    .gte("date", lastWeekDays[0].date)
    .lte("date", lastWeekDays[6].date)
    .order("date", { ascending: true });

  const lastWeekApprovedList = (lastWeekExpenses ?? []).filter((e) => e.status === "APROBADO");
  const lastWeekPendingList = (lastWeekExpenses ?? []).filter((e) => e.status === "REPORTADO");
  const lastWeekRejectedList = (lastWeekExpenses ?? []).filter((e) => e.status === "RECHAZADO");
  const lastWeekApprovedTotal = lastWeekApprovedList.reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );
  const paymentDate = nextOccurrenceOf(settings.payment_day_of_week);
  const paymentDateLabel = `${dayOfWeekLabel(dict, settings.payment_day_of_week)} ${paymentDate.getDate()}`;

  const thisWeekDays = currentWeekDays(dict, new Date());
  const { data: thisWeekReportedExpenses } = await supabase
    .from("expenses")
    .select("id, type, date, amount, currency, status, rejection_reason")
    .eq("user_id", user!.id)
    .gte("date", thisWeekDays[0].date)
    .lte("date", thisWeekDays[6].date)
    .order("date", { ascending: true });

  const kpis: KpiDef[] = [
    {
      key: "aprobados",
      label: K.approved,
      sublabel: `${K.approvedSublabelPrefix}${paymentDateLabel}`,
      icon: CHECK_ICON,
      color: "success",
      value: formatCurrency(lastWeekApprovedTotal, "CRC"),
      items: lastWeekApprovedList,
    },
    {
      key: "reportados",
      label: K.reported,
      sublabel: K.thisWeek,
      icon: REPORTED_ICON,
      color: "brand",
      value: String((thisWeekReportedExpenses ?? []).length),
      items: thisWeekReportedExpenses ?? [],
    },
    {
      key: "pendientes",
      label: K.pending,
      sublabel: K.lastWeek,
      icon: CLOCK_ICON,
      color: "warning",
      value: String(lastWeekPendingList.length),
      items: lastWeekPendingList,
    },
    {
      key: "rechazados",
      label: K.rejected,
      sublabel: K.lastWeek,
      icon: REJECTED_ICON,
      color: "danger",
      value: String(lastWeekRejectedList.length),
      items: lastWeekRejectedList,
    },
  ];

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <WeekTracker
        weekDays={weekDays}
        countsByDate={countsByDate}
        maxDaily={dailyTypes.length}
        offset={offset}
        minOffset={MIN_OFFSET}
        maxOffset={MAX_OFFSET}
        dict={dict}
      />

      <StatusKpiRow kpis={kpis} />

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
