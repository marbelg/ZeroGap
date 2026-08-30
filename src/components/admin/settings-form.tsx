"use client";

import { useActionState } from "react";
import { updateSettings, type SettingsFormState } from "@/app/admin/configuracion/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { AppSettings } from "@/types/database";

const initialState: SettingsFormState = {};

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, isPending] = useActionState(updateSettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-foreground">
          Presupuesto semanal por empleado
        </h2>
        <p className="mb-4 text-xs text-foreground-muted">
          Solo informativo — si un empleado se pasa, se ve como aviso, pero no le
          bloquea reportar más gastos. Déjalo en 0 para desactivar ese aviso.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="weekly_budget_total">Total semanal</Label>
            <Input
              id="weekly_budget_total"
              name="weekly_budget_total"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.weekly_budget_total}
            />
          </div>
          <div>
            <Label htmlFor="weekly_budget_desayuno">Desayuno</Label>
            <Input
              id="weekly_budget_desayuno"
              name="weekly_budget_desayuno"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.weekly_budget_desayuno}
            />
          </div>
          <div>
            <Label htmlFor="weekly_budget_almuerzo">Almuerzo</Label>
            <Input
              id="weekly_budget_almuerzo"
              name="weekly_budget_almuerzo"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.weekly_budget_almuerzo}
            />
          </div>
          <div>
            <Label htmlFor="weekly_budget_cena">Cena</Label>
            <Input
              id="weekly_budget_cena"
              name="weekly_budget_cena"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.weekly_budget_cena}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Kilometraje</h2>
        <p className="mb-4 text-xs text-foreground-muted">
          Tarifa que se paga por cada kilómetro reportado (el admin asigna los km
          de cada viaje al revisar las fotos, y el sistema calcula el monto).
        </p>
        <div className="max-w-[200px]">
          <Label htmlFor="km_rate">Tarifa por km (CRC)</Label>
          <Input
            id="km_rate"
            name="km_rate"
            type="number"
            step="0.01"
            min="0"
            defaultValue={settings.km_rate}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Día de pago</h2>
        <p className="mb-4 text-xs text-foreground-muted">
          Día de la semana en que normalmente se pagan los gastos de la semana
          anterior — el empleado ve este dato en su pantalla de inicio.
        </p>
        <div className="max-w-[200px]">
          <Label htmlFor="payment_day_of_week">Se paga cada</Label>
          <Select
            id="payment_day_of_week"
            name="payment_day_of_week"
            defaultValue={settings.payment_day_of_week}
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {state.error && (
        <p className="rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-[var(--radius-sm)] bg-success-soft px-3 py-2 text-sm text-success">
          Configuración guardada.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
