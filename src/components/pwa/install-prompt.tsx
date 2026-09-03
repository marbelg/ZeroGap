"use client";

import { useEffect, useState } from "react";
import { useDict } from "@/i18n/locale-provider";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "zerogap:install-prompt-dismissed-at";
const DISMISS_DAYS = 14;

/**
 * Banner de instalación de la PWA. Se basa en el evento `beforeinstallprompt`,
 * que solo dispara Chrome/Edge en Android (y Chromium en desktop) cuando se
 * cumplen los criterios de instalabilidad (manifest + service worker + HTTPS).
 * iOS Safari no dispara este evento — ahí no hay prompt automático posible.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const dict = useDict();

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const dismissedRecently =
      dismissedAt > 0 &&
      Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      if (dismissedRecently) return;
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function onAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm sm:px-0 sm:pb-0">
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-xl shadow-black/10">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-brand-soft text-base font-bold text-brand">
          ZG
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {dict.employee.installPrompt.title}
          </p>
          <p className="text-xs text-foreground-muted">
            {dict.employee.installPrompt.subtitle}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            onClick={handleInstall}
            className="rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            {dict.employee.installPrompt.install}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-full px-3.5 py-1 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            {dict.employee.installPrompt.notNow}
          </button>
        </div>
      </div>
    </div>
  );
}
