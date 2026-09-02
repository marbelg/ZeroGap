"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type { ExpenseType, Profile } from "@/types/database";
import type { EnrichedExpense } from "@/lib/expenses";
import { EXPENSE_TYPE_LABEL, EXPENSE_TYPE_COLOR } from "@/lib/expense-meta";
import { optionsForRole } from "@/lib/employee-categories";
import { ExpenseStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PhotoCapture } from "@/components/expense/photo-capture";
import {
  approveExpense,
  rejectExpense,
  deleteExpenseAdmin,
  updateExpenseAdmin,
  createExpenseManual,
  assignMileageKm,
  type ExpenseEditState,
  type ManualExpenseState,
  type AssignKmState,
} from "@/app/admin/gastos/actions";

const editEmptyState: ExpenseEditState = {};
const manualEmptyState: ManualExpenseState = {};
const assignKmEmptyState: AssignKmState = {};

export function ExpenseManager({
  expenses,
  employees,
}: {
  expenses: EnrichedExpense[];
  employees: Profile[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const employeeById = new Map(employees.map((e) => [e.id, e]));

  const totals = expenses.reduce(
    (acc, e) => {
      acc.count++;
      if (e.status === "REPORTADO") acc.pending++;
      acc.total += Number(e.amount);
      return acc;
    },
    { count: 0, pending: 0, total: 0 },
  );

  function handleApprove(id: string) {
    startTransition(() => {
      approveExpense(id);
    });
  }

  function handleReject(id: string) {
    const reason = window.prompt("¿Motivo del rechazo?");
    if (reason === null) return;
    startTransition(() => {
      rejectExpense(id, reason);
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este gasto? Esta acción no se puede deshacer.")) return;
    startTransition(() => {
      deleteExpenseAdmin(id);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-foreground-muted">
          {totals.count} gasto{totals.count === 1 ? "" : "s"} · {totals.pending} pendiente
          {totals.pending === 1 ? "" : "s"} · {formatCurrency(totals.total, "CRC")} en total
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          + Nuevo gasto
        </Button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {expenses.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-foreground-muted">
            No hay gastos con estos filtros.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                employee={employeeById.get(expense.user_id)}
                isPending={isPending}
                onApprove={() => handleApprove(expense.id)}
                onReject={() => handleReject(expense.id)}
                onDelete={() => handleDelete(expense.id)}
              />
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <ManualExpenseDialog employees={employees} onClose={() => setCreateOpen(false)} />
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
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        danger
          ? "text-danger hover:bg-danger-soft"
          : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ExpenseRow({
  expense,
  employee,
  isPending,
  onApprove,
  onReject,
  onDelete,
}: {
  expense: EnrichedExpense;
  employee?: Profile;
  isPending: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const photo = expense.photos[0];
  const startPhoto = expense.photos.find((p) => p.photo_type === "ODOMETRO_INICIAL");
  const endPhoto = expense.photos.find((p) => p.photo_type === "ODOMETRO_FINAL");

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
          style={{ backgroundColor: EXPENSE_TYPE_COLOR[expense.type] }}
        >
          {EXPENSE_TYPE_LABEL[expense.type]}
        </span>
        <span className="font-medium text-foreground">
          {employee ? `${employee.first_name} ${employee.last_name}` : "—"}
        </span>
        <span className="text-xs text-foreground-muted">{formatDate(expense.date)}</span>
        <span className="ml-auto text-right font-semibold text-foreground">
          {expense.type === "KILOMETRAJE" ? (
            expense.mileage ? (
              <>
                {Number(expense.mileage.kilometers).toFixed(1)} km
                <span className="block text-xs font-normal text-foreground-muted">
                  {formatCurrency(expense.amount, expense.currency)}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-warning">Sin km asignados</span>
            )
          ) : expense.type === "HOSPEDAJE" && expense.nights ? (
            <>
              {expense.nights} noche{expense.nights === 1 ? "" : "s"}
              <span className="block text-xs font-normal text-foreground-muted">
                {formatCurrency(expense.amount, expense.currency)}
              </span>
            </>
          ) : (
            formatCurrency(expense.amount, expense.currency)
          )}
        </span>
        <ExpenseStatusBadge status={expense.status} />
      </div>

      {expense.type === "HOSPEDAJE" &&
        expense.reported_rate != null &&
        employee?.nightly_rate != null &&
        Number(expense.reported_rate) !== Number(employee.nightly_rate) && (
          <p className="mt-1 rounded-[var(--radius-sm)] bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
            ⚠️ El hotel aplicó {formatCurrency(expense.reported_rate, "CRC")}/noche, pero la
            tarifa registrada es {formatCurrency(employee.nightly_rate, "CRC")}/noche.
          </p>
        )}

      {expense.description && (
        <p className="mt-0.5 truncate text-xs text-foreground-muted">{expense.description}</p>
      )}
      {expense.status === "RECHAZADO" && expense.rejection_reason && (
        <p className="mt-0.5 truncate text-xs text-danger">Motivo: {expense.rejection_reason}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        {expense.type === "KILOMETRAJE" ? (
          <>
            {startPhoto?.signedUrl && (
              <a
                href={startPhoto.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand-soft"
              >
                Ver foto de inicio
              </a>
            )}
            {endPhoto?.signedUrl && (
              <a
                href={endPhoto.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand-soft"
              >
                Ver foto de fin
              </a>
            )}
          </>
        ) : (
          photo?.signedUrl && (
            <a
              href={photo.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand-soft"
            >
              Ver comprobante{expense.photos.length > 1 ? ` (${expense.photos.length})` : ""}
            </a>
          )
        )}
        {expense.status === "REPORTADO" && (
          <>
            <ActionChip disabled={isPending} onClick={onApprove}>
              Aprobar
            </ActionChip>
            <ActionChip disabled={isPending} onClick={onReject}>
              Rechazar
            </ActionChip>
          </>
        )}
        <ActionChip onClick={() => setEditing((v) => !v)}>
          {editing ? "Cerrar" : expense.type === "KILOMETRAJE" ? "Asignar km" : "Editar"}
        </ActionChip>
        <ActionChip danger disabled={isPending} onClick={onDelete}>
          Eliminar
        </ActionChip>
      </div>

      {editing && expense.type === "KILOMETRAJE" && (
        <InlineAssignKmForm expense={expense} onClose={() => setEditing(false)} />
      )}
      {editing && expense.type !== "KILOMETRAJE" && (
        <InlineExpenseEditForm expense={expense} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

function InlineAssignKmForm({
  expense,
  onClose,
}: {
  expense: EnrichedExpense;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(assignMileageKm, assignKmEmptyState);

  useEffect(() => {
    if (state.ok) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-surface-muted p-3"
    >
      <input type="hidden" name="expense_id" value={expense.id} />
      <div>
        <Label htmlFor={`km-${expense.id}`}>Kilómetros recorridos</Label>
        <Input
          id={`km-${expense.id}`}
          name="km"
          type="number"
          step="0.1"
          min="0"
          defaultValue={expense.mileage ? Number(expense.mileage.kilometers) : ""}
          required
        />
        <p className="mt-1 text-xs text-foreground-muted">
          Revisa las fotos de inicio/fin y escribe cuántos km fueron — el monto a
          pagar se calcula solo con la tarifa configurada.
        </p>
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

function InlineExpenseEditForm({
  expense,
  onClose,
}: {
  expense: EnrichedExpense;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateExpenseAdmin, editEmptyState);

  useEffect(() => {
    if (state.ok) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-surface-muted p-3"
    >
      <input type="hidden" name="id" value={expense.id} />
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <Label htmlFor={`date-${expense.id}`}>Fecha</Label>
          <Input id={`date-${expense.id}`} name="date" type="date" defaultValue={expense.date} required />
        </div>
        <div>
          <Label htmlFor={`time-${expense.id}`}>Hora</Label>
          <Input id={`time-${expense.id}`} name="time" type="time" defaultValue={expense.time} required />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2.5">
        <div>
          <Label htmlFor={`amount-${expense.id}`}>Monto</Label>
          <Input
            id={`amount-${expense.id}`}
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={expense.amount}
            required
          />
        </div>
        <div>
          <Label htmlFor={`currency-${expense.id}`}>Moneda</Label>
          <Select id={`currency-${expense.id}`} name="currency" defaultValue={expense.currency} className="w-24">
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </Select>
        </div>
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

function ManualExpenseDialog({
  employees,
  onClose,
}: {
  employees: Profile[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createExpenseManual, manualEmptyState);
  // Si solo hay un empleado en contexto (el caso normal: se abre desde la
  // página de un usuario específico), la categoría se limita a lo que ese
  // rol puede reportar — así no se puede crear "Desayuno" para un hotel.
  const singleEmployee = employees.length === 1 ? employees[0] : null;
  const ALL_TYPES: ExpenseType[] = [
    "DESAYUNO",
    "ALMUERZO",
    "CENA",
    "KILOMETRAJE",
    "REPARACION_LLANTAS",
    "CAJA_CHICA",
    "HOSPEDAJE",
    "PEAJE",
  ];
  const allowedTypes = singleEmployee
    ? optionsForRole(singleEmployee.role).map((o) => o.type)
    : ALL_TYPES;
  const [type, setType] = useState<ExpenseType>(allowedTypes[0]);

  useEffect(() => {
    if (state.ok) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <Dialog title="Nuevo gasto (manual)" onClose={onClose} wide>
      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="m_employee">Empleado</Label>
            <Select
              id="m_employee"
              name="user_id"
              required
              defaultValue={employees.length === 1 ? employees[0].id : ""}
            >
              {employees.length !== 1 && (
                <option value="" disabled>
                  Selecciona…
                </option>
              )}
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="m_type">Categoría</Label>
            <Select
              id="m_type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as ExpenseType)}
            >
              {allowedTypes.map((t) => (
                <option key={t} value={t}>
                  {EXPENSE_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="m_date">Fecha</Label>
            <Input id="m_date" name="date" type="date" required />
          </div>
          <div>
            <Label htmlFor="m_time">Hora</Label>
            <Input id="m_time" name="time" type="time" required />
          </div>
        </div>

        {type === "KILOMETRAJE" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="m_start_time">Hora de inicio</Label>
                <Input id="m_start_time" name="start_time" type="time" required />
              </div>
              <div>
                <Label htmlFor="m_end_time">Hora de finalización</Label>
                <Input id="m_end_time" name="end_time" type="time" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="m_start_location">Lugar de inicio</Label>
                <Input id="m_start_location" name="start_location" required />
              </div>
              <div>
                <Label htmlFor="m_end_location">Lugar de destino</Label>
                <Input id="m_end_location" name="end_location" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="m_initial_odometer">Kilometraje inicial</Label>
                <Input
                  id="m_initial_odometer"
                  name="initial_odometer"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="m_final_odometer">Kilometraje final</Label>
                <Input
                  id="m_final_odometer"
                  name="final_odometer"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="m_description">Descripción (opcional)</Label>
              <Input id="m_description" name="description" />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <Label htmlFor="m_amount">Monto</Label>
                <Input id="m_amount" name="amount" type="number" step="0.01" min="0" required />
              </div>
              <div>
                <Label htmlFor="m_currency">Moneda</Label>
                <Select id="m_currency" name="currency" defaultValue="CRC" className="w-24">
                  <option value="CRC">CRC</option>
                  <option value="USD">USD</option>
                </Select>
              </div>
            </div>
            <PhotoCapture name="photo" label="Foto del comprobante (opcional)" />
          </>
        )}

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
            {isPending ? "Creando…" : "Crear gasto"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
