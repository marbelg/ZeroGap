"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createMileageExpense, type ExpenseFormState } from "@/app/empleado/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PhotoCapture } from "@/components/expense/photo-capture";

const initialState: ExpenseFormState = {};

function todayDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function MileageExpenseForm() {
  const [state, formAction, isPending] = useActionState(createMileageExpense, initialState);
  const router = useRouter();
  const [initialOdometer, setInitialOdometer] = useState("");
  const [finalOdometer, setFinalOdometer] = useState("");

  const km =
    initialOdometer && finalOdometer
      ? Number(finalOdometer) - Number(initialOdometer)
      : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" name="date" type="date" defaultValue={todayDateValue()} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="start_time">Hora de inicio</Label>
          <Input id="start_time" name="start_time" type="time" required />
        </div>
        <div>
          <Label htmlFor="end_time">Hora de finalización</Label>
          <Input id="end_time" name="end_time" type="time" required />
        </div>
      </div>

      <div>
        <Label htmlFor="start_location">Lugar de inicio</Label>
        <Input id="start_location" name="start_location" placeholder="Ej. Oficina San José" required />
      </div>
      <div>
        <Label htmlFor="end_location">Lugar de destino</Label>
        <Input id="end_location" name="end_location" placeholder="Ej. Cliente Heredia" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="initial_odometer">Kilometraje inicial</Label>
          <Input
            id="initial_odometer"
            name="initial_odometer"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            required
            value={initialOdometer}
            onChange={(e) => setInitialOdometer(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="final_odometer">Kilometraje final</Label>
          <Input
            id="final_odometer"
            name="final_odometer"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            required
            value={finalOdometer}
            onChange={(e) => setFinalOdometer(e.target.value)}
          />
        </div>
      </div>

      {km !== null && (
        <p className="text-sm text-foreground-muted">
          Kilómetros recorridos:{" "}
          <span
            className={`font-semibold ${km > 0 ? "text-foreground" : "text-danger"}`}
          >
            {km > 0 ? km.toFixed(1) : "—"} km
          </span>
        </p>
      )}

      <div>
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Input id="description" name="description" placeholder="Ej. Visita a cliente" />
      </div>

      <PhotoCapture name="start_photo" label="Foto de odómetro inicial" required />
      <PhotoCapture name="end_photo" label="Foto de odómetro final" required />

      {state.error && (
        <p className="rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={isPending} className="flex-1">
          {isPending ? "Enviando…" : "Enviar"}
        </Button>
      </div>
    </form>
  );
}
