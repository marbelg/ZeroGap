import Link from "next/link";
import { cn } from "@/lib/utils";
import { weekRangeLabel, type WeekDay } from "@/lib/week";

export function WeekTracker({
  weekDays,
  countsByDate,
  maxDaily = 4,
  offset = 0,
  minOffset = 0,
  maxOffset = 0,
}: {
  weekDays: WeekDay[];
  countsByDate: Record<string, number>;
  maxDaily?: number;
  // Semana mostrada respecto a la actual (0 = esta semana). Permite navegar
  // con flechas sin salir de la pantalla de inicio ni elegir un tipo de gasto.
  offset?: number;
  minOffset?: number;
  maxOffset?: number;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <p className="mb-2 text-sm font-semibold text-foreground">Mi semana</p>
      <div className="mb-2 flex items-center justify-between gap-2">
        {offset > minOffset ? (
          <Link
            href={`/empleado?offset=${offset - 1}`}
            aria-label="Semana anterior"
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            ←
          </Link>
        ) : (
          <span className="flex size-6 shrink-0 items-center justify-center text-foreground-muted/30">
            ←
          </span>
        )}
        <div className="text-center">
          <p className="text-xs font-medium text-foreground-muted">{weekRangeLabel(weekDays)}</p>
          {offset !== 0 && (
            <Link href="/empleado" className="text-[10px] font-medium text-brand">
              Volver a esta semana
            </Link>
          )}
        </div>
        {offset < maxOffset ? (
          <Link
            href={`/empleado?offset=${offset + 1}`}
            aria-label="Semana siguiente"
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            →
          </Link>
        ) : (
          <span className="flex size-6 shrink-0 items-center justify-center text-foreground-muted/30">
            →
          </span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const count = countsByDate[day.date] ?? 0;
          return (
            <Link
              key={day.date}
              href={`/empleado/dia/${day.date}`}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[var(--radius-md)] py-1.5 transition-colors",
                day.isToday ? "bg-brand-soft" : "hover:bg-surface-muted",
              )}
            >
              <span className="text-[9px] font-medium uppercase text-foreground-muted">
                {day.dayName}
              </span>
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[11px] font-bold",
                  count === 0 && "bg-surface-muted text-foreground-muted",
                  count > 0 && count < maxDaily && "bg-warning-soft text-warning",
                  count >= maxDaily && "bg-success-soft text-success",
                )}
              >
                {count}
              </span>
              <span className="text-[9px] text-foreground-muted">{day.dayNumber}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
