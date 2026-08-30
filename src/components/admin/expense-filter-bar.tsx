import { DATE_PRESET_LABEL, type DatePreset } from "@/lib/date-ranges";
import type { ExpenseSearchParams } from "@/lib/expense-filters";
import type { Profile } from "@/types/database";

export function ExpenseFilterBar({
  sp,
  employees,
  clearHref,
}: {
  sp: ExpenseSearchParams;
  employees: Profile[];
  clearHref: string;
}) {
  const preset = (sp.date as DatePreset) || "mes";
  const selectedEmployee = sp.employee ? sp.employee.split(",")[0] : "";

  return (
    <form
      method="get"
      className="mb-4 grid grid-cols-2 gap-2 rounded-[var(--radius-lg)] border border-border bg-surface p-3 sm:grid-cols-4"
    >
      <select
        name="date"
        defaultValue={preset}
        className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm text-foreground"
      >
        {(Object.keys(DATE_PRESET_LABEL) as DatePreset[]).map((key) => (
          <option key={key} value={key}>
            {DATE_PRESET_LABEL[key]}
          </option>
        ))}
      </select>

      <select
        name="type"
        defaultValue={sp.type ?? ""}
        className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm text-foreground"
      >
        <option value="">Todas las categorías</option>
        <option value="DESAYUNO">Desayuno</option>
        <option value="ALMUERZO">Almuerzo</option>
        <option value="CENA">Cena</option>
        <option value="KILOMETRAJE">Kilometraje</option>
        <option value="REPARACION_LLANTAS">Reparación de llantas</option>
      </select>

      <select
        name="status"
        defaultValue={sp.status ?? ""}
        className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm text-foreground"
      >
        <option value="">Todos los estados</option>
        <option value="REPORTADO">Reportado</option>
        <option value="APROBADO">Aprobado</option>
        <option value="RECHAZADO">Rechazado</option>
      </select>

      <select
        name="employee"
        defaultValue={selectedEmployee}
        className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm text-foreground"
      >
        <option value="">Todos los empleados</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.first_name} {e.last_name}
          </option>
        ))}
      </select>

      <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-4">
        <input
          type="date"
          name="from"
          defaultValue={sp.from ?? ""}
          placeholder="Desde"
          className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm text-foreground"
        />
        <input
          type="date"
          name="to"
          defaultValue={sp.to ?? ""}
          placeholder="Hasta"
          className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm text-foreground"
        />
      </div>

      <button
        type="submit"
        className="col-span-2 h-10 rounded-full bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover sm:col-span-2"
      >
        Filtrar
      </button>
      <a
        href={clearHref}
        className="col-span-2 flex h-10 items-center justify-center rounded-full border border-border text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted sm:col-span-2"
      >
        Limpiar
      </a>
    </form>
  );
}
