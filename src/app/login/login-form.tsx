"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useDict } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/locales";

const initialState: LoginState = {};

export default function LoginForm({
  enabledLocales,
  logoUrl,
}: {
  enabledLocales: Locale[];
  logoUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const dict = useDict();

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-background px-5 py-10">
      <div className="mb-4">
        <LanguageSwitcher currentLocale={dict.locale} enabledLocales={enabledLocales} />
      </div>
      <div className="mb-8 flex flex-col items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="size-14 rounded-2xl object-contain shadow-lg shadow-brand/25"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6d5cf6] to-[#4a3cd6] text-xl font-bold text-white shadow-lg shadow-brand/25">
            ZG
          </div>
        )}
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">ZeroGap</h1>
          <p className="text-sm text-foreground-muted">{dict.auth.brandTagline}</p>
        </div>
      </div>

      <form
        action={formAction}
        className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm"
      >
        <div className="mb-4">
          <Label htmlFor="identifier">{dict.auth.usernameLabel}</Label>
          <Input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            autoCapitalize="characters"
            placeholder={dict.auth.usernamePlaceholder}
            required
          />
        </div>

        <div className="mb-2">
          <Label htmlFor="password">{dict.auth.passwordLabel}</Label>
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
          {isPending ? dict.auth.signingIn : dict.auth.signIn}
        </Button>

        <p className="mt-4 text-center text-xs text-foreground-muted">
          {dict.auth.forgotPassword}
        </p>
      </form>
    </div>
  );
}
