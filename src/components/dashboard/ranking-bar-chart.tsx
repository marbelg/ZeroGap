"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export interface RankingDatum {
  id: string;
  label: string;
  value: number;
}

export function RankingBarChart({
  title,
  data,
}: {
  title: string;
  data: RankingDatum[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
        <p className="py-6 text-center text-sm text-foreground-muted">Sin datos todavía.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <p className="mb-4 text-sm font-semibold text-foreground">{title}</p>
      <div className="flex flex-col gap-2.5">
        {data.map((d) => {
          const widthPct = Math.max(3, (d.value / max) * 100);
          return (
            <div
              key={d.id}
              onMouseEnter={() => setHovered(d.id)}
              onMouseLeave={() => setHovered((h) => (h === d.id ? null : h))}
              className="flex items-center gap-2.5"
            >
              <span className="w-24 shrink-0 truncate text-xs text-foreground-muted">
                {d.label}
              </span>
              <div className="relative h-5 flex-1 rounded-[4px] bg-surface-muted">
                <div
                  className="h-5 rounded-[4px] bg-brand transition-opacity"
                  style={{
                    width: `${widthPct}%`,
                    opacity: hovered === null || hovered === d.id ? 1 : 0.45,
                  }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-xs font-semibold text-foreground">
                {formatCurrency(d.value, "CRC")}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
