"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { UserStatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  createEmployee,
  createEmployeesBulk,
  updateEmployee,
  toggleEmployeeStatus,
  resetEmployeePassword,
  deleteEmployee,
  type EmployeeFormState,
  type BulkEmployeeResult,
} from "@/app/admin/empleados/actions";

const emptyState: EmployeeFormState = {};

export function EmployeeManager({ employees }: { employees: Profile[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [revealPassword, setRevealPassword] = useState<{
    name: string;
    password: string;
    employeeCode?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(employee: Profile) {
    startTransition(() => {
      toggleEmployeeStatus(employee.id, employee.status === "INACTIVE");
    });
  }

  function handleDelete(employee: Profile) {
    if (
      !window.confirm(
        `¿Eliminar a ${employee.first_name} ${employee.last_name}? Esta acción no se puede deshacer.`,
      )
    )
      return;
    startTransition(() => {
      deleteEmployee(employee.id);
    });
  }

  async function handleResetPassword(employee: Profile) {
    if (
      !window.confirm(
        `¿Generar una nueva contraseña temporal para ${employee.first_name}?`,
      )
    )
      return;
    const result = await resetEmployeePassword(employee.id);
    if (result.tempPassword) {
      setRevealPassword({
        name: `${employee.first_name} ${employee.last_name}`,
        password: result.tempPassword,
        employeeCode: employee.employee_code ?? undefined,
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setBulkOpen(true)}
          className="w-full sm:w-auto"
        >
          Crear varios
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          + Nuevo empleado
        </Button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {employees.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-foreground-muted">
            Aún no hay empleados registrados.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {employees.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                isPending={isPending}
                onToggle={() => handleToggle(employee)}
                onResetPassword={() => handleResetPassword(employee)}
                onDelete={() => handleDelete(employee)}
              />
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <CreateEmployeeDialog
          onClose={() => setCreateOpen(false)}
          onCreated={(name, password, employeeCode) => {
            setCreateOpen(false);
            setRevealPassword({ name, password, employeeCode });
          }}
        />
      )}

      {bulkOpen && <BulkCreateDialog onClose={() => setBulkOpen(false)} />}

      {revealPassword && (
        <PasswordRevealDialog
          name={revealPassword.name}
          password={revealPassword.password}
          employeeCode={revealPassword.employeeCode}
          onClose={() => setRevealPassword(null)}
        />
      )}
    </div>
  );
}

function ActionChip({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
        danger
          ? "text-danger hover:bg-danger-soft"
          : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EmployeeRow({
  employee,
  isPending,
  onToggle,
  onResetPassword,
  onDelete,
}: {
  employee: Profile;
  isPending: boolean;
  onToggle: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="shrink-0 rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
          {employee.employee_code ?? "—"}
        </span>
        <span className="font-medium text-foreground">
          {employee.first_name} {employee.last_name}
        </span>
        <UserStatusBadge status={employee.status} />
        <span className="ml-auto text-xs text-foreground-muted">
          {employee.role === "ADMIN" ? "Admin" : "Empleado"}
        </span>
      </div>

      <p className="mt-0.5 truncate text-xs text-foreground-muted">
        {employee.email}
        {employee.department ? ` · ${employee.department}` : ""}
      </p>

      <div className="mt-2 flex flex-wrap gap-1">
        <ActionChip onClick={() => setEditing((v) => !v)}>
          {editing ? "Cerrar" : "Editar"}
        </ActionChip>
        <ActionChip disabled={isPending} onClick={onToggle}>
          {employee.status === "ACTIVE" ? "Desactivar" : "Activar"}
        </ActionChip>
        <ActionChip onClick={onResetPassword}>Restablecer clave</ActionChip>
        <ActionChip danger disabled={isPending} onClick={onDelete}>
          Eliminar
        </ActionChip>
      </div>

      {editing && (
        <InlineEditForm employee={employee} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

function InlineEditForm({
  employee,
  onClose,
}: {
  employee: Profile;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateEmployee, emptyState);

  useEffect(() => {
    if (state.ok) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-surface-muted p-3"
    >
      <input type="hidden" name="id" value={employee.id} />
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <Label htmlFor={`fn-${employee.id}`}>Nombre</Label>
          <Input
            id={`fn-${employee.id}`}
            name="first_name"
            defaultValue={employee.first_name}
            required
          />
        </div>
        <div>
          <Label htmlFor={`ln-${employee.id}`}>Apellido</Label>
          <Input
            id={`ln-${employee.id}`}
            name="last_name"
            defaultValue={employee.last_name}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <Label htmlFor={`dept-${employee.id}`}>Departamento</Label>
          <Input
            id={`dept-${employee.id}`}
            name="department"
            defaultValue={employee.department ?? ""}
          />
        </div>
        <div>
          <Label htmlFor={`pos-${employee.id}`}>Puesto</Label>
          <Input
            id={`pos-${employee.id}`}
            name="position"
            defaultValue={employee.position ?? ""}
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`code-${employee.id}`}>ID</Label>
        <Input
          id={`code-${employee.id}`}
          name="employee_code"
          defaultValue={employee.employee_code ?? ""}
        />
      </div>

      {state.error && (
        <p className="rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending} className="flex-1">
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

function Dialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-t-[var(--radius-lg)] border border-border bg-surface p-5 shadow-xl sm:rounded-[var(--radius-lg)] sm:p-6",
          wide ? "max-w-2xl" : "max-w-md",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-foreground-muted transition-colors hover:text-foreground"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateEmployeeDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (name: string, password: string, employeeCode?: string) => void;
}) {
  const [state, formAction, isPending] = useActionState(createEmployee, emptyState);
  const [fullName, setFullName] = useState("");

  return (
    <Dialog title="Nuevo empleado" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="first_name">Nombre</Label>
            <Input
              id="first_name"
              name="first_name"
              required
              onChange={(e) =>
                setFullName((prev) => `${e.target.value} ${prev.split(" ")[1] ?? ""}`.trim())
              }
            />
          </div>
          <div>
            <Label htmlFor="last_name">Apellido</Label>
            <Input
              id="last_name"
              name="last_name"
              required
              onChange={(e) =>
                setFullName((prev) => `${prev.split(" ")[0] ?? ""} ${e.target.value}`.trim())
              }
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="department">Departamento</Label>
            <Input id="department" name="department" />
          </div>
          <div>
            <Label htmlFor="position">Puesto</Label>
            <Input id="position" name="position" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="employee_code">ID (opcional)</Label>
            <Input id="employee_code" name="employee_code" placeholder="Se genera solo" />
          </div>
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select id="role" name="role" defaultValue="EMPLOYEE">
              <option value="EMPLOYEE">Empleado</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </div>
        </div>

        {state.error && (
          <p className="rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        {state.tempPassword && (
          <CreatedNotice
            password={state.tempPassword}
            employeeCode={state.employeeCode}
            onDone={() =>
              onCreated(fullName || "El nuevo empleado", state.tempPassword!, state.employeeCode)
            }
          />
        )}

        {!state.tempPassword && (
          <Button type="submit" disabled={isPending} className="mt-2 w-full">
            {isPending ? "Creando…" : "Crear empleado"}
          </Button>
        )}
      </form>
    </Dialog>
  );
}

function CreatedNotice({
  password,
  employeeCode,
  onDone,
}: {
  password: string;
  employeeCode?: string;
  onDone: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-success-soft px-3 py-2 text-sm text-success">
      Usuario creado.{" "}
      {employeeCode && (
        <>
          ID: <span className="font-mono font-semibold">{employeeCode}</span> —{" "}
        </>
      )}
      Contraseña temporal:{" "}
      <button type="button" onClick={onDone} className="font-mono font-semibold underline">
        {password}
      </button>
    </div>
  );
}

function PasswordRevealDialog({
  name,
  password,
  employeeCode,
  onClose,
}: {
  name: string;
  password: string;
  employeeCode?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Dialog title="Contraseña temporal" onClose={onClose}>
      <p className="mb-3 text-sm text-foreground-muted">
        Comparte esta contraseña con <strong>{name}</strong>
        {employeeCode ? (
          <>
            {" "}
            (ID <span className="font-mono font-semibold text-foreground">{employeeCode}</span>)
          </>
        ) : null}{" "}
        por un canal seguro. No se volverá a mostrar.
      </p>
      <div
        className={cn(
          "mb-4 flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 font-mono text-lg font-semibold text-foreground",
        )}
      >
        {password}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(password).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="text-xs font-sans font-semibold text-brand"
        >
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
      <Button onClick={onClose} className="w-full">
        Listo
      </Button>
    </Dialog>
  );
}

function BulkCreateDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"count" | "results">("count");
  const [count, setCount] = useState(5);
  const [results, setResults] = useState<BulkEmployeeResult[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleCreateAll() {
    // Se crean con nombre de marcador ("Empleado 1", "Empleado 2"...) — el
    // admin no necesita saber quién va en cada cuenta todavía. Más tarde,
    // desde "Editar" en la fila, le pone el nombre real a cada una cuando
    // le asigne la cuenta a una persona (identificándola por su ID).
    const placeholders = Array.from({ length: count }, (_, i) => ({
      first_name: "Empleado",
      last_name: String(i + 1),
    }));

    startTransition(async () => {
      const created = await createEmployeesBulk(placeholders);
      setResults(created);
      setStep("results");
    });
  }

  if (step === "results") {
    const summaryText = results
      .filter((r) => r.email && r.tempPassword)
      .map((r) => `ID ${r.employeeCode}: ${r.email} / ${r.tempPassword}`)
      .join("\n");

    return (
      <Dialog title="Empleados creados" onClose={onClose} wide>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-foreground-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">ID</th>
                <th className="py-2 pr-3 font-medium">Usuario (correo)</th>
                <th className="py-2 pr-3 font-medium">Contraseña</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {r.error ? (
                    <td colSpan={3} className="py-2 pr-3 text-danger">
                      Error: {r.error}
                    </td>
                  ) : (
                    <>
                      <td className="py-2 pr-3 font-mono font-semibold text-foreground">
                        {r.employeeCode}
                      </td>
                      <td className="py-2 pr-3 font-mono text-foreground-muted">{r.email}</td>
                      <td className="py-2 pr-3 font-mono font-semibold text-foreground">
                        {r.tempPassword}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-foreground-muted">
          Reparte cada ID + contraseña a la persona correspondiente. Cuando sepas quién
          es cada quien, entra a &quot;Editar&quot; en esa fila (busca por su ID) y ponle
          el nombre real — no hace falta crear la cuenta de nuevo.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(summaryText)}
            className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
          >
            Copiar todo
          </button>
          <Button onClick={onClose} className="flex-1">
            Listo
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog title="Crear varios empleados" onClose={onClose}>
      <p className="mb-3 text-sm text-foreground-muted">
        ¿Cuántos empleados quieres crear? Se crean de una vez con un ID, usuario y
        contraseña listos para usar — luego, cuando sepas para quién es cada uno, le
        pones el nombre real desde &quot;Editar&quot;.
      </p>
      <Label htmlFor="bulk_count">Cantidad</Label>
      <Input
        id="bulk_count"
        type="number"
        min={1}
        max={30}
        value={count}
        onChange={(e) => setCount(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
      />
      <Button onClick={handleCreateAll} disabled={isPending} className="mt-4 w-full">
        {isPending ? "Creando…" : `Crear ${count} empleado${count === 1 ? "" : "s"}`}
      </Button>
    </Dialog>
  );
}
