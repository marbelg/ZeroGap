"use client";

import { useActionState } from "react";
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

/**
 * Kilometraje simplificado a propósito: solo fecha + 2 fotos (inicio y fin
 * del viaje). Sin lugares, horas ni números de odómetro que escribir — los
 * empleados que lo usan tienen poca familiaridad con leer/escribir.
 */
export function MileageExpenseForm() {
  const [state, formAction, isPending] = useActionState(createMileageExpense, initialState);
  const router = useRouter();

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" name="date" type="date" defaultValue={todayDateValue()} required />
      </div>

      <PhotoCapture name="start_photo" label="Foto de inicio del viaje" required />
      <PhotoCapture name="end_photo" label="Foto de fin del viaje" required />

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
