"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "./get-dictionary";

const DictContext = createContext<Dictionary | null>(null);

export function LocaleProvider({
  dict,
  children,
}: {
  dict: Dictionary;
  children: ReactNode;
}) {
  return <DictContext.Provider value={dict}>{children}</DictContext.Provider>;
}

export function useDict(): Dictionary {
  const dict = useContext(DictContext);
  if (!dict) {
    throw new Error("useDict() debe usarse dentro de <LocaleProvider>.");
  }
  return dict;
}
