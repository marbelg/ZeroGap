"use client";

import { useState, type ReactNode } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { EXPENSE_TYPE_LABEL } from "@/lib/expense-meta";
import type { Currency, ExpenseType } from "@/types/database";

export interface KpiExpenseItem {
  id: string;
  type: ExpenseType;
  date: string;
  amount: number;
  currency: Currency;
  rejection_reason?: string | null;
}

export interface KpiDef {
  key: string;
  label: string;
  sublabel?: string;
  icon: ReactNode;
  color: "success" | "warning" | "danger" | "brand";
  value: string;
  items: KpiExpenseItem[];
}

const COLOR_CLASSES: Record<KpiDef["color"], string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-soft text-brand",
};

// KPIs pensados para empleados con poca familiaridad con lectura: ícono
// grande + número grande + etiqueta corta, mismo color en la tarjeta y en
// la lista que se despliega al tocar (refuerza la asociación visual).
export function StatusKpiRow({ kpis }: { kpis: KpiDef[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = kpis.find((k) => k.key === selected);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1.5">
        {kpis.map((kpi) => (
          <button
            key={kpi.key}
            type="button"
            onClick={() => setSelected((v) => (v === kpi.key ? null : kpi.key))}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-[var(--radius-md)] p-2 transition-transform active:scale-[0.96]",
              COLOR_CLASSES[kpi.color],
              selected === kpi.key && "ring-2 ring-offset-1 ring-current",
            )}
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
              {kpi.icon}
            </svg>
            <span className="text-sm font-bold leading-none">{kpi.value}</span>
            <span className="text-center text-[9px] font-semibold leading-tight">
              {kpi.label}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className={cn(
            "rounded-[var(--radius-md)] border border-border bg-surface p-3",
          )}
        >
          <p className={cn("mb-2 text-xs font-semibold", COLOR_CLASSES[active.color].split(" ")[1])}>
            {active.label}
            {active.sublabel ? ` · ${active.sublabel}` : ""}
          </p>
          {active.items.length === 0 ? (
            <p className="text-sm text-foreground-muted">Nada por aquí.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {active.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {EXPENSE_TYPE_LABEL[item.type]}
                    </p>
                    <p className="text-xs text-foreground-muted">{formatDate(item.date)}</p>
                    {item.rejection_reason && (
                      <p className="text-xs text-danger">Motivo: {item.rejection_reason}</p>
                    )}
                  </div>
                  <p className="shrink-0 font-semibold text-foreground">
                    {formatCurrency(item.amount, item.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
