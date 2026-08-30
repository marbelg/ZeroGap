"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createMealExpense, type ExpenseFormState } from "@/app/empleado/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { PhotoCapture } from "@/components/expense/photo-capture";
import type { ExpenseType } from "@/types/database";

const initialState: ExpenseFormState = {};

function nowTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function todayDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function MealExpenseForm({
  type,
  initialDate,
}: {
  type: ExpenseType;
  initialDate?: string;
}) {
  const action = createMealExpense.bind(null, type);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const router = useRouter();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={initialDate || todayDateValue()}
            required
          />
        </div>
        <div>
          <Label htmlFor="time">Hora</Label>
          <Input id="time" name="time" type="time" defaultValue={nowTimeValue()} required />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">Moneda</Label>
          <Select id="currency" name="currency" defaultValue="CRC" className="w-24">
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </Select>
        </div>
      </div>

      <PhotoCapture name="photo" label="Foto del comprobante" required />

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
