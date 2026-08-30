import Link from "next/link";
import { cn } from "@/lib/utils";
import type { WeekDay } from "@/lib/week";

export function WeekTracker({
  weekDays,
  countsByDate,
  maxDaily = 4,
  categoriesLabel = "Desayuno · Almuerzo · Cena · Kilometraje",
}: {
  weekDays: WeekDay[];
  countsByDate: Record<string, number>;
  maxDaily?: number;
  categoriesLabel?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Mi semana</p>
        <p className="text-xs text-foreground-muted">{categoriesLabel}</p>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const count = countsByDate[day.date] ?? 0;
          return (
            <Link
              key={day.date}
              href={`/empleado/dia/${day.date}`}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] py-2 transition-colors",
                day.isToday ? "bg-brand-soft" : "hover:bg-surface-muted",
              )}
            >
              <span className="text-[10px] font-medium uppercase text-foreground-muted">
                {day.dayName}
              </span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                  count === 0 && "bg-surface-muted text-foreground-muted",
                  count > 0 && count < maxDaily && "bg-warning-soft text-warning",
                  count >= maxDaily && "bg-success-soft text-success",
                )}
              >
                {count}
              </span>
              <span className="text-[10px] text-foreground-muted">{day.dayNumber}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
