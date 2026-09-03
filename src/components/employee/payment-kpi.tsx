"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { expenseTypeLabel } from "@/lib/expense-meta";
import { useDict } from "@/i18n/locale-provider";
import type { Expense } from "@/types/database";

export function PaymentKpi({ expenses }: { expenses: Expense[] }) {
  const [open, setOpen] = useState(false);
  const dict = useDict();
  const EXPENSE_TYPE_LABEL = expenseTypeLabel(dict);

  if (expenses.length === 0) return null;

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-brand-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left"
      >
        <div>
          <p className="text-xs font-medium text-brand">{dict.employee.paymentKpi.title}</p>
          <p className="text-2xl font-semibold text-brand">{formatCurrency(total, "CRC")}</p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-brand">
          {open ? dict.employee.paymentKpi.hideBreakdown : dict.employee.paymentKpi.showBreakdown}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 border-t border-brand/20 px-4 py-3">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {EXPENSE_TYPE_LABEL[e.type]}
                </p>
                <p className="text-xs text-foreground-muted">{formatDate(e.date)}</p>
              </div>
              <p className="shrink-0 font-semibold text-foreground">
                {formatCurrency(e.amount, e.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
