"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/types/database";

export interface EmployeeGastoStats {
  count: number;
  pending: number;
}

export function GastosEmployeeList({
  employees,
  statsByUser,
}: {
  employees: Profile[];
  statsByUser: Record<string, EmployeeGastoStats>;
}) {
  const [query, setQuery] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (onlyPending && !(statsByUser[e.id]?.pending ?? 0)) return false;
      if (!q) return true;
      const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
      const code = (e.employee_code ?? "").toLowerCase();
      return fullName.includes(q) || code.includes(q);
    });
  }, [employees, statsByUser, query, onlyPending]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o ID…"
          className="h-11 flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-foreground placeholder:text-foreground-muted outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand-soft"
        />
        <label className="flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-foreground-muted">
          <input
            type="checkbox"
            checked={onlyPending}
            onChange={(e) => setOnlyPending(e.target.checked)}
            className="size-4 accent-[var(--brand)]"
          />
          Solo pendientes
        </label>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {filtered.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-foreground-muted">
            {employees.length === 0
              ? "Aún no hay empleados registrados."
              : "No hay empleados que coincidan con la búsqueda."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((employee) => {
              const stats = statsByUser[employee.id];
              return (
                <Link
                  key={employee.id}
                  href={`/admin/gastos/${employee.id}`}
                  className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                  <span className="shrink-0 rounded-md bg-surface-muted px-2 py-1 font-mono text-xs font-semibold text-foreground">
                    {employee.employee_code ?? "—"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
                    {employee.first_name} {employee.last_name}
                  </span>
                  {stats?.pending ? (
                    <span className="shrink-0 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
                      {stats.pending} pendiente{stats.pending === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  <span className="shrink-0 text-xs text-foreground-muted">
                    {stats?.count ?? 0} esta semana
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4 shrink-0 text-foreground-muted"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
