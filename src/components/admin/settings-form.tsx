"use client";

import { useActionState, type ReactNode } from "react";
import { updateSettings, type SettingsFormState } from "@/app/admin/configuracion/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FlagIcon } from "@/components/icons/flags";
import { cn } from "@/lib/utils";
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

function SectionHeader({
  icon,
  iconClassName,
  title,
  hint,
}: {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand",
          iconClassName,
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4.5"
        >
          {icon}
        </svg>
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-foreground-muted">{hint}</p>
      </div>
    </div>
  );
}

function CheckboxRow({
  children,
  checked,
  defaultChecked,
  disabled,
  name,
  caption,
}: {
  children: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string;
  caption?: string;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border px-3 py-2.5",
        disabled ? "bg-surface-muted" : "bg-surface",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {children}
        {caption && <span className="text-xs font-normal text-foreground-muted">{caption}</span>}
      </span>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="size-4.5 shrink-0 accent-brand disabled:opacity-60"
      />
    </label>
  );
}

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, isPending] = useActionState(updateSettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 pb-20">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 lg:col-span-2">
          <SectionHeader
            icon={
              <>
                <path d="M4 20V10M12 20V4M20 20v-7" />
              </>
            }
            title="Presupuesto por empleado"
            hint="Solo informativo: si se pasa, se ve como aviso — no bloquea reportar. 0 = sin aviso. Total es semanal; Desayuno/Almuerzo/Cena son el máximo permitido por día."
          />
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div>
              <Label htmlFor="weekly_budget_total">Total (semanal)</Label>
              <Input
                id="weekly_budget_total"
                name="weekly_budget_total"
                type="number"
                step="0.01"
                min="0"
                className="h-11"
                defaultValue={settings.weekly_budget_total}
              />
            </div>
            <div>
              <Label htmlFor="weekly_budget_desayuno">Desayuno (diario)</Label>
              <Input
                id="weekly_budget_desayuno"
                name="weekly_budget_desayuno"
                type="number"
                step="0.01"
                min="0"
                className="h-11"
                defaultValue={settings.weekly_budget_desayuno}
              />
            </div>
            <div>
              <Label htmlFor="weekly_budget_almuerzo">Almuerzo (diario)</Label>
              <Input
                id="weekly_budget_almuerzo"
                name="weekly_budget_almuerzo"
                type="number"
                step="0.01"
                min="0"
                className="h-11"
                defaultValue={settings.weekly_budget_almuerzo}
              />
            </div>
            <div>
              <Label htmlFor="weekly_budget_cena">Cena (diario)</Label>
              <Input
                id="weekly_budget_cena"
                name="weekly_budget_cena"
                type="number"
                step="0.01"
                min="0"
                className="h-11"
                defaultValue={settings.weekly_budget_cena}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader
            iconClassName="bg-[var(--chart-series-6)]/15 text-[var(--chart-series-6)]"
            icon={
              <>
                <rect x="3" y="5" width="18" height="15" rx="2" />
                <path d="M3 9h18" />
                <path d="M8 3v4M16 3v4" />
              </>
            }
            title="Presupuesto mensual por rol"
            hint="Solo informativo — compara el gasto total del mes contra este monto. 0 = sin aviso."
          />
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor="monthly_budget_caja_chica">Caja chica</Label>
              <Input
                id="monthly_budget_caja_chica"
                name="monthly_budget_caja_chica"
                type="number"
                step="0.01"
                min="0"
                className="h-11"
                defaultValue={settings.monthly_budget_caja_chica}
              />
            </div>
            <div>
              <Label htmlFor="monthly_budget_no_directo">Empleados no directos</Label>
              <Input
                id="monthly_budget_no_directo"
                name="monthly_budget_no_directo"
                type="number"
                step="0.01"
                min="0"
                className="h-11"
                defaultValue={settings.monthly_budget_no_directo}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SectionHeader
                iconClassName="bg-[var(--chart-series-4)]/15 text-[var(--chart-series-4)]"
                icon={
                  <>
                    <path d="M5 16v-4l2-5h10l2 5v4" />
                    <path d="M3 16h18M5 12h14" />
                    <circle cx="7.5" cy="17.5" r="1.5" />
                    <circle cx="16.5" cy="17.5" r="1.5" />
                  </>
                }
                title="Kilometraje"
                hint="Tarifa por km."
              />
              <div className="mt-4">
                <Label htmlFor="km_rate">Tarifa por km (CRC)</Label>
                <Input
                  id="km_rate"
                  name="km_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-11"
                  defaultValue={settings.km_rate}
                />
              </div>
            </div>

            <div>
              <SectionHeader
                icon={
                  <>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </>
                }
                title="Día de pago"
                hint="Se paga la semana anterior."
              />
              <div className="mt-4">
                <Label htmlFor="payment_day_of_week">Se paga cada</Label>
                <Select
                  id="payment_day_of_week"
                  name="payment_day_of_week"
                  className="h-11"
                  defaultValue={settings.payment_day_of_week}
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader
            iconClassName="bg-[var(--chart-series-7)]/15 text-[var(--chart-series-7)]"
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </>
            }
            title="Idiomas"
            hint="Qué banderas ven los usuarios en el selector de idioma de toda la app."
          />
          <div className="mt-4 flex flex-col gap-2">
            <CheckboxRow checked disabled caption="Siempre activo">
              <FlagIcon locale="es" /> Español
            </CheckboxRow>
            <CheckboxRow name="locale_en_enabled" defaultChecked={settings.locale_en_enabled}>
              <FlagIcon locale="en" /> English
            </CheckboxRow>
            <CheckboxRow name="locale_fr_enabled" defaultChecked={settings.locale_fr_enabled}>
              <FlagIcon locale="fr" /> Français (Canada)
            </CheckboxRow>
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader
            iconClassName="bg-[var(--chart-series-5)]/15 text-[var(--chart-series-5)]"
            icon={
              <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="1.5" />
                <path d="M4 17l5-5 4 4 3-3 4 4" />
              </>
            }
            title="Logo"
            hint="Reemplaza el ícono ZG en Administración y en la pantalla de Login."
          />
          <div className="mt-4 flex items-center gap-3">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt="Logo actual"
                className="size-14 shrink-0 rounded-xl border border-border object-contain"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d5cf6] to-[#4a3cd6] text-sm font-bold text-white">
                ZG
              </div>
            )}
            <div className="min-w-0 flex-1">
              <input
                type="file"
                name="logo"
                accept="image/*"
                className="block w-full text-xs text-foreground-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand hover:file:bg-brand-soft/70"
              />
              {settings.logo_url && (
                <label className="mt-2 flex items-center gap-1.5 text-xs text-foreground-muted">
                  <input type="checkbox" name="remove_logo" className="size-3.5 accent-danger" />
                  Quitar logo actual
                </label>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          {state.error && (
            <p className="flex-1 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="flex-1 rounded-[var(--radius-sm)] bg-success-soft px-3 py-2 text-sm text-success">
              Configuración guardada.
            </p>
          )}
          <Button type="submit" disabled={isPending} className="ml-auto shrink-0">
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}
