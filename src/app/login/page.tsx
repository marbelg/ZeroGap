"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-background px-5 py-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6d5cf6] to-[#4a3cd6] text-xl font-bold text-white shadow-lg shadow-brand/25">
          ZG
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">ZeroGap</h1>
          <p className="text-sm text-foreground-muted">Control de gastos de empleados</p>
        </div>
      </div>

      <form
        action={formAction}
        className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm"
      >
        <div className="mb-4">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@empresa.com"
            required
          />
        </div>

        <div className="mb-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        {state.error && (
          <p className="mb-2 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isPending} className="mt-4 w-full">
          {isPending ? "Ingresando…" : "Ingresar"}
        </Button>

        <p className="mt-4 text-center text-xs text-foreground-muted">
          ¿Olvidaste tu contraseña? Contacta a Administración para restablecerla.
        </p>
      </form>
    </div>
  );
}
