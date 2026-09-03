"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createMealExpense, type ExpenseFormState } from "@/app/empleado/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PhotoCapture } from "@/components/expense/photo-capture";
import type { ExpenseType } from "@/types/database";
import { minReportableDate, todayISODate } from "@/lib/week";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { useDict } from "@/i18n/locale-provider";

const initialState: ExpenseFormState = {};

function nowTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function MealExpenseForm({
  type,
  initialDate,
  requireDescription,
}: {
  type: ExpenseType;
  initialDate?: string;
  requireDescription?: boolean;
}) {
  const action = createMealExpense.bind(null, type);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const router = useRouter();
  const dict = useDict();

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
          <Label htmlFor="time">{dict.common.fields.time}</Label>
          <Input id="time" name="time" type="time" defaultValue={nowTimeValue()} required />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <Label htmlFor="amount">{dict.common.fields.amount}</Label>
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
          <Label htmlFor="currency">{dict.common.fields.currency}</Label>
          <Select id="currency" name="currency" defaultValue="CRC" className="w-24">
            {SUPPORTED_CURRENCIES.filter((c) => c.enabled).map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {requireDescription && (
        <div>
          <Label htmlFor="description">{dict.employee.forms.cajaChicaDescriptionLabel}</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder={dict.employee.forms.mealDescriptionPlaceholder}
            required
          />
        </div>
      )}

      <PhotoCapture name="photo" label={dict.employee.forms.receiptPhoto} required />

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
