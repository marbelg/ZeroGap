"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export interface TrendPoint {
  label: string;
  value: number;
}

const WIDTH = 600;
const HEIGHT = 180;
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

export function TrendChart({ title, points }: { title: string; points: TrendPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const max = Math.max(1, ...points.map((p) => p.value));
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const coords = points.map((p, i) => ({
    x: points.length > 1 ? PAD_X + (i / (points.length - 1)) * innerWidth : PAD_X + innerWidth / 2,
    y: PAD_TOP + innerHeight - (p.value / max) * innerHeight,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const areaPath =
    coords.length > 0
      ? `${linePath} L${coords[coords.length - 1].x},${PAD_TOP + innerHeight} L${coords[0].x},${PAD_TOP + innerHeight} Z`
      : "";

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHovered(closest);
  }

  const activePoint = hovered !== null ? points[hovered] : null;
  const activeCoord = hovered !== null ? coords[hovered] : null;

  return (
    <Card className="p-4">
      <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
      {points.length === 0 ? (
        <p className="py-14 text-center text-sm text-foreground-muted">Sin datos todavía.</p>
      ) : (
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            onMouseMove={handleMove}
            onMouseLeave={() => setHovered(null)}
          >
            {[0, 0.5, 1].map((t) => (
              <line
                key={t}
                x1={PAD_X}
                x2={WIDTH - PAD_X}
                y1={PAD_TOP + innerHeight * t}
                y2={PAD_TOP + innerHeight * t}
                stroke="var(--chart-gridline)"
                strokeWidth={1}
              />
            ))}

            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
            </defs>

            {areaPath && <path d={areaPath} fill="url(#trendFill)" />}
            <path
              d={linePath}
              fill="none"
              stroke="var(--brand)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {activeCoord && (
              <>
                <line
                  x1={activeCoord.x}
                  x2={activeCoord.x}
                  y1={PAD_TOP}
                  y2={PAD_TOP + innerHeight}
                  stroke="var(--chart-axis)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r={4}
                  fill="var(--brand)"
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              </>
            )}
          </svg>

          {activePoint && activeCoord && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[var(--radius-sm)] bg-foreground px-2 py-1 text-xs font-semibold text-background shadow-lg"
              style={{
                left: `${(activeCoord.x / WIDTH) * 100}%`,
                top: `${(activeCoord.y / HEIGHT) * 100 - 4}%`,
              }}
            >
              {activePoint.label}: {formatCurrency(activePoint.value, "CRC")}
            </div>
          )}

          <div className="mt-1 flex justify-between text-[10px] text-foreground-muted">
            <span>{points[0]?.label}</span>
            <span>{points[points.length - 1]?.label}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
