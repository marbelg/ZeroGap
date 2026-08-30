"use client";

import { useActionState, useState, useTransition } from "react";
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
  const [editing, setEditing] = useState<Profile | null>(null);
  const [revealPassword, setRevealPassword] = useState<{
    name: string;
    password: string;
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
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <Button size="md" variant="secondary" onClick={() => setBulkOpen(true)}>
          Crear varios
        </Button>
        <Button size="md" onClick={() => setCreateOpen(true)}>
          + Nuevo empleado
        </Button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-foreground-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Correo</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Departamento</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-foreground-muted"
                  >
                    Aún no hay empleados registrados.
                  </td>
                </tr>
              )}
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {employee.first_name} {employee.last_name}
                  </td>
                  <td className="px-5 py-3.5 text-foreground-muted">{employee.email}</td>
                  <td className="px-5 py-3.5 text-foreground-muted">
                    {employee.role === "ADMIN" ? "Admin" : "Empleado"}
                  </td>
                  <td className="px-5 py-3.5 text-foreground-muted">
                    {employee.department ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <UserStatusBadge status={employee.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setEditing(employee)}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                      >
                        Editar
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleToggle(employee)}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                      >
                        {employee.status === "ACTIVE" ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => handleResetPassword(employee)}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                      >
                        Restablecer clave
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleDelete(employee)}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger-soft"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <CreateEmployeeDialog
          onClose={() => setCreateOpen(false)}
          onCreated={(name, password) => {
            setCreateOpen(false);
            setRevealPassword({ name, password });
          }}
        />
      )}

      {bulkOpen && <BulkCreateDialog onClose={() => setBulkOpen(false)} />}

      {editing && (
        <EditEmployeeDialog employee={editing} onClose={() => setEditing(null)} />
      )}

      {revealPassword && (
        <PasswordRevealDialog
          name={revealPassword.name}
          password={revealPassword.password}
          onClose={() => setRevealPassword(null)}
        />
      )}
    </div>
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
          "w-full rounded-t-[var(--radius-lg)] border border-border bg-surface p-6 shadow-xl sm:rounded-[var(--radius-lg)]",
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
  onCreated: (name: string, password: string) => void;
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
            <Label htmlFor="employee_code">Código (opcional)</Label>
            <Input id="employee_code" name="employee_code" />
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
            onDone={() => onCreated(fullName || "El nuevo empleado", state.tempPassword!)}
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
  onDone,
}: {
  password: string;
  onDone: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-success-soft px-3 py-2 text-sm text-success">
      Usuario creado. Contraseña temporal:{" "}
      <button type="button" onClick={onDone} className="font-mono font-semibold underline">
        {password}
      </button>
    </div>
  );
}

function EditEmployeeDialog({
  employee,
  onClose,
}: {
  employee: Profile;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateEmployee, emptyState);

  return (
    <Dialog title="Editar empleado" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={employee.id} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit_first_name">Nombre</Label>
            <Input
              id="edit_first_name"
              name="first_name"
              defaultValue={employee.first_name}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit_last_name">Apellido</Label>
            <Input
              id="edit_last_name"
              name="last_name"
              defaultValue={employee.last_name}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit_department">Departamento</Label>
            <Input
              id="edit_department"
              name="department"
              defaultValue={employee.department ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="edit_position">Puesto</Label>
            <Input id="edit_position" name="position" defaultValue={employee.position ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor="edit_employee_code">Código (opcional)</Label>
          <Input
            id="edit_employee_code"
            name="employee_code"
            defaultValue={employee.employee_code ?? ""}
          />
        </div>

        {state.error && (
          <p className="rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <div className="mt-2 flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function PasswordRevealDialog({
  name,
  password,
  onClose,
}: {
  name: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Dialog title="Contraseña temporal" onClose={onClose}>
      <p className="mb-3 text-sm text-foreground-muted">
        Comparte esta contraseña con <strong>{name}</strong> por un canal seguro. No
        se volverá a mostrar.
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
  const [step, setStep] = useState<"count" | "names" | "results">("count");
  const [count, setCount] = useState(5);
  const [people, setPeople] = useState<{ first_name: string; last_name: string }[]>([]);
  const [results, setResults] = useState<BulkEmployeeResult[]>([]);
  const [isPending, startTransition] = useTransition();

  function startNamesStep() {
    setPeople(
      Array.from({ length: count }, (_, i) => people[i] ?? { first_name: "", last_name: "" }),
    );
    setStep("names");
  }

  function updatePerson(index: number, field: "first_name" | "last_name", value: string) {
    setPeople((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  function handleCreateAll() {
    startTransition(async () => {
      const created = await createEmployeesBulk(people);
      setResults(created);
      setStep("results");
    });
  }

  const readyCount = people.filter((p) => p.first_name.trim() && p.last_name.trim()).length;

  if (step === "results") {
    const summaryText = results
      .filter((r) => r.email && r.tempPassword)
      .map((r) => `${r.first_name} ${r.last_name}: ${r.email} / ${r.tempPassword}`)
      .join("\n");

    return (
      <Dialog title="Empleados creados" onClose={onClose} wide>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-foreground-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Nombre</th>
                <th className="py-2 pr-3 font-medium">Usuario (correo)</th>
                <th className="py-2 pr-3 font-medium">Contraseña</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 text-foreground">
                    {r.first_name} {r.last_name}
                  </td>
                  {r.error ? (
                    <td colSpan={2} className="py-2 pr-3 text-danger">
                      Error: {r.error}
                    </td>
                  ) : (
                    <>
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
          Anota o comparte cada usuario y contraseña con la persona correspondiente — no
          se van a volver a mostrar juntos.
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

  if (step === "names") {
    return (
      <Dialog title={`Nombres de los ${count} empleados`} onClose={onClose} wide>
        <div className="max-h-[55vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-3">
            {people.map((person, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <Input
                  placeholder={`Nombre ${i + 1}`}
                  value={person.first_name}
                  onChange={(e) => updatePerson(i, "first_name", e.target.value)}
                />
                <Input
                  placeholder={`Apellido ${i + 1}`}
                  value={person.last_name}
                  onChange={(e) => updatePerson(i, "last_name", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs text-foreground-muted">
          El usuario y la contraseña de cada uno se generan automáticamente al crearlos.
        </p>

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setStep("count")} className="flex-1">
            Atrás
          </Button>
          <Button
            onClick={handleCreateAll}
            disabled={isPending || readyCount === 0}
            className="flex-1"
          >
            {isPending
              ? "Creando…"
              : `Crear ${readyCount || ""} empleado${readyCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog title="Crear varios empleados" onClose={onClose}>
      <p className="mb-3 text-sm text-foreground-muted">
        ¿Cuántos empleados quieres crear? Después te pido el nombre de cada uno.
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
      <Button onClick={startNamesStep} className="mt-4 w-full">
        Continuar
      </Button>
    </Dialog>
  );
}
