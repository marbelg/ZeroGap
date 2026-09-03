import type { Currency } from "@/types/database";

export interface CurrencyMeta {
  code: Currency | "CAD";
  label: string;
  // CAD es un marcador para cuando se agregue soporte real (columna de BD +
  // tipo `Currency` incluidos) — hoy no es una moneda operable en el sistema.
  enabled: boolean;
}

export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: "CRC", label: "CRC", enabled: true },
  { code: "USD", label: "USD", enabled: true },
  { code: "CAD", label: "CAD", enabled: false },
];
