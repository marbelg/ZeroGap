import Link from "next/link";
import { cn } from "@/lib/utils";
import type { WeekDay } from "@/lib/week";

const MAX_DAILY = 4; // desayuno, almuerzo, cena, kilometraje

export function WeekTracker({
  weekDays,
  countsByDate,
}: {
  weekDays: WeekDay[];
  countsByDate: Record<string, number>;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Mi semana</p>
        <p className="text-xs text-foreground-muted">Desayuno · Almuerzo · Cena · Kilometraje</p>
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
                  count > 0 && count < MAX_DAILY && "bg-warning-soft text-warning",
                  count === MAX_DAILY && "bg-success-soft text-success",
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
