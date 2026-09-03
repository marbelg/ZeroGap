"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createLodgingExpense, type ExpenseFormState } from "@/app/empleado/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PhotoCapture } from "@/components/expense/photo-capture";
import { minReportableDate, todayISODate } from "@/lib/week";
import { dict } from "@/i18n/dictionary";

const initialState: ExpenseFormState = {};

/**
 * El hotel reporta fecha, noches y la tarifa que aplicó — el monto que se
 * paga se calcula con la tarifa que tiene configurada el admin en el
 * perfil del hotel (no la que escribe aquí); si las dos tarifas no
 * coinciden, el admin ve una alerta al revisar el gasto.
 */
export function LodgingExpenseForm({ initialDate }: { initialDate?: string }) {
  const [state, formAction, isPending] = useActionState(createLodgingExpense, initialState);
  const router = useRouter();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date">{dict.common.fields.date}</Label>
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
          <Label htmlFor="nights">{dict.common.fields.nights}</Label>
          <Input
            id="nights"
            name="nights"
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            placeholder={dict.employee.forms.nightsPlaceholder}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="reported_rate">{dict.employee.forms.reportedRateLabel}</Label>
        <Input
          id="reported_rate"
          name="reported_rate"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">{dict.employee.forms.lodgingDescriptionLabel}</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          placeholder={dict.employee.forms.lodgingDescriptionPlaceholder}
        />
      </div>

      <PhotoCapture name="photo" label={dict.employee.forms.invoicePhoto} required />

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
          {dict.common.actions.cancel}
        </Button>
        <Button type="submit" size="lg" disabled={isPending} className="flex-1">
          {isPending ? dict.common.actions.submitting : dict.common.actions.submit}
        </Button>
      </div>
    </form>
  );
}
