"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export interface CategoryBarDatum {
  label: string;
  value: number;
  color: string;
}

export function CategoryBarChart({
  title,
  data,
  compact,
}: {
  title: string;
  data: CategoryBarDatum[];
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <Card className="p-3">
      <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
      <div
        className={`flex items-stretch gap-2 border-b border-[var(--chart-axis)] pb-0 ${compact ? "h-20" : "h-32"}`}
      >
        {data.map((d, i) => {
          const heightPct = Math.max(2, (d.value / max) * 100);
          return (
            <div
              key={d.label}
              className="relative flex flex-1 flex-col items-center justify-end gap-2"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              {hovered === i && (
                <div className="absolute -top-9 z-10 whitespace-nowrap rounded-[var(--radius-sm)] bg-foreground px-2 py-1 text-xs font-semibold text-background shadow-lg">
                  {formatCurrency(d.value, "CRC")}
                </div>
              )}
              <div
                className="w-full rounded-t-[4px] transition-opacity"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: d.color,
                  opacity: hovered === null || hovered === i ? 1 : 0.45,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[11px] text-foreground-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
