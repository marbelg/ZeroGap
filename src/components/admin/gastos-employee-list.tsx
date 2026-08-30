"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";

export interface EmployeeGastoStats {
  count: number;
  pending: number;
}

type SortKey = "code" | "name" | "pending" | "count";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "code", label: "ID" },
  { key: "name", label: "Empleado" },
  { key: "pending", label: "Pendientes" },
  { key: "count", label: "Esta semana" },
];

export function GastosEmployeeList({
  employees,
  statsByUser,
}: {
  employees: Profile[];
  statsByUser: Record<string, EmployeeGastoStats>;
}) {
  const [query, setQuery] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = employees.filter((e) => {
      if (onlyPending && !(statsByUser[e.id]?.pending ?? 0)) return false;
      if (!q) return true;
      const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
      const code = (e.employee_code ?? "").toLowerCase();
      return fullName.includes(q) || code.includes(q);
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "code") {
        cmp = (a.employee_code ?? "").localeCompare(b.employee_code ?? "");
      } else if (sortKey === "name") {
        cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      } else if (sortKey === "pending") {
        cmp = (statsByUser[a.id]?.pending ?? 0) - (statsByUser[b.id]?.pending ?? 0);
      } else {
        cmp = (statsByUser[a.id]?.count ?? 0) - (statsByUser[b.id]?.count ?? 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [employees, statsByUser, query, onlyPending, sortKey, sortDir]);

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
        {rows.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-foreground-muted">
            {employees.length === 0
              ? "Aún no hay empleados registrados."
              : "No hay empleados que coincidan con la búsqueda."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-foreground-muted">
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="px-5 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="flex items-center gap-1 transition-colors hover:text-foreground"
                      >
                        {col.label}
                        <span className="text-[10px]">
                          {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </span>
                      </button>
                    </th>
                  ))}
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((employee) => {
                  const stats = statsByUser[employee.id];
                  return (
                    <tr
                      key={employee.id}
                      className="border-b border-border last:border-0 hover:bg-surface-muted"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/gastos/${employee.id}`}
                          className="rounded-md bg-surface-muted px-2 py-1 font-mono text-xs font-semibold text-foreground"
                        >
                          {employee.employee_code ?? "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/gastos/${employee.id}`}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {employee.first_name} {employee.last_name}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        {stats?.pending ? (
                          <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
                            {stats.pending}
                          </span>
                        ) : (
                          <span className="text-xs text-foreground-muted">0</span>
                        )}
                      </td>
                      <td className={cn("px-5 py-4 text-foreground-muted")}>
                        {stats?.count ?? 0}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/gastos/${employee.id}`}
                          className="text-xs font-semibold text-brand"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
