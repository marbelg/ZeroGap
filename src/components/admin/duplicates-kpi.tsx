"use client";

import { useState } from "react";
import Link from "next/link";
import { useDict } from "@/i18n/locale-provider";
import { expenseTypeLabel } from "@/lib/expense-meta";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DuplicateSummary } from "@/lib/duplicate-detection";

// Mismo patrón de "tocar el KPI despliega el detalle" que ya se usa en la
// pantalla de inicio del empleado (StatusKpiRow) — acá el detalle lista los
// gastos marcados con un link directo a la pantalla de ese empleado, donde
// viven los botones de Aprobar/Rechazar que resuelven la alerta.
export function DuplicatesKpiCard({ summaries }: { summaries: DuplicateSummary[] }) {
  const [open, setOpen] = useState(false);
  const dict = useDict();
  const D = dict.admin.duplicates;
  const TYPE_LABEL = expenseTypeLabel(dict);

  return (
    <div className="col-span-2 rounded-[var(--radius-lg)] border border-border bg-surface sm:col-span-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={summaries.length === 0}
        className="flex w-full items-center justify-between gap-2 p-4 text-left disabled:cursor-default"
      >
        <div>
          <p className="text-xs font-medium text-foreground-muted">{D.cardTitle}</p>
          <p
            className={`text-2xl font-semibold ${summaries.length > 0 ? "text-warning" : "text-foreground-muted"}`}
          >
            {summaries.length}
          </p>
        </div>
        {summaries.length > 0 && (
          <span className="shrink-0 text-xs font-semibold text-brand">
            {open ? "▲" : "▼"}
          </span>
        )}
      </button>

      {open && summaries.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border p-3">
          {summaries.map((s) => (
            <Link
              key={s.expenseId}
              href={`/admin/gastos/${s.employeeId}`}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-warning-soft px-3 py-2.5 text-sm transition-opacity hover:opacity-80"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {s.employeeName} · {TYPE_LABEL[s.type]}
                </p>
                <p className="text-xs text-warning">
                  {s.sameEmployee ? D.sameEmployeeMessage : `${s.otherEmployeeNames.join(", ")}${D.otherEmployeeSuffix}`}
                </p>
                <p className="text-xs text-foreground-muted">{formatDate(s.date)}</p>
              </div>
              <p className="shrink-0 font-semibold text-foreground">
                {formatCurrency(s.amount, s.currency)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
