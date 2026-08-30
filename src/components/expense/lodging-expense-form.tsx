"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createLodgingExpense, type ExpenseFormState } from "@/app/empleado/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PhotoCapture } from "@/components/expense/photo-capture";
import { minReportableDate, todayISODate } from "@/lib/week";

const initialState: ExpenseFormState = {};

/**
 * El hotel solo reporta fecha, noches y la factura — el monto se calcula
 * solo (noches x tarifa por noche de ese hotel, configurada por el admin),
 * no lo escribe el hotel.
 */
export function LodgingExpenseForm({ initialDate }: { initialDate?: string }) {
  const [state, formAction, isPending] = useActionState(createLodgingExpense, initialState);
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
            defaultValue={initialDate || todayISODate()}
            min={minReportableDate()}
            max={todayISODate()}
            required
          />
        </div>
        <div>
          <Label htmlFor="nights">Noches</Label>
          <Input
            id="nights"
            name="nights"
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            placeholder="1"
            required
          />
        </div>
      </div>

      <PhotoCapture name="photo" label="Foto de la factura" required />

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
