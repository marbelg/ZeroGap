import type { ReactNode } from "react";
import type { ExpenseType, UserRole } from "@/types/database";

export interface ExpenseCategoryOption {
  href: string;
  type: ExpenseType;
  label: string;
  color: string;
  icon: ReactNode;
  // Un hotel puede hospedar a varios colaboradores el mismo día — a
  // diferencia del resto de categorías (una vez al día), esta permite
  // reportar más de una vez el mismo día sin que se "reemplacen" entre sí.
  allowMultiple?: boolean;
}

// Íconos pensados para reconocerse a simple vista, sin leer el texto —
// pensado para empleados con poca familiaridad con la lectura.
const DESAYUNO_ICON = (
  <>
    <path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
    <path d="M16 10h1.5a2.5 2.5 0 1 1 0 5H16" />
    <path d="M8 3c0 .8-.8.9-.8 1.7S8 6.2 8 6.2M12 3c0 .8-.8.9-.8 1.7s.8 1.5.8 1.5" />
  </>
);

const ALMUERZO_ICON = (
  <>
    <path d="M7 2v7a1 1 0 0 0 2 0V2M8 2v20" />
    <path d="M16 2c-1.3 0-2 1.8-2 4s.7 4 2 4v12" />
  </>
);

const CENA_ICON = (
  <>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    <path d="M17 3v2M18 4h-2" />
  </>
);

const KILOMETRAJE_ICON = (
  <>
    <path d="M5 16v-4l2-5h10l2 5v4" />
    <path d="M3 16h18M5 12h14" />
    <circle cx="7.5" cy="17.5" r="1.5" />
    <circle cx="16.5" cy="17.5" r="1.5" />
  </>
);

const LLANTAS_ICON = (
  <>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
  </>
);

const PEAJE_ICON = (
  <>
    <path d="M5 4v16M19 4v16" />
    <path d="M5 9l14-3" />
    <circle cx="5" cy="9" r="1" />
  </>
);

const OTROS_ICON = (
  <>
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </>
);

const CAJA_CHICA_ICON = (
  <>
    <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z" />
    <path d="M9 7h6M9 11h6" />
  </>
);

const HOSPEDAJE_ICON = (
  <>
    <path d="M3 21V6M3 12h16a2 2 0 0 1 2 2v7" />
    <path d="M3 9h6a2 2 0 0 1 2 2v1" />
    <circle cx="7" cy="8" r="1.5" />
  </>
);

const EMPLOYEE_OPTIONS: ExpenseCategoryOption[] = [
  {
    href: "/empleado/desayuno",
    type: "DESAYUNO",
    label: "Desayuno",
    color: "from-[#ffb74d] to-[#f57c1f]",
    icon: DESAYUNO_ICON,
  },
  {
    href: "/empleado/almuerzo",
    type: "ALMUERZO",
    label: "Almuerzo",
    color: "from-[#5ad48b] to-[#1f9e5c]",
    icon: ALMUERZO_ICON,
  },
  {
    href: "/empleado/cena",
    type: "CENA",
    label: "Cena",
    color: "from-[#7c8cf8] to-[#4a3cd6]",
    icon: CENA_ICON,
  },
  {
    href: "/empleado/kilometraje",
    type: "KILOMETRAJE",
    label: "Kilometraje",
    color: "from-[#4dd0e1] to-[#0097a7]",
    icon: KILOMETRAJE_ICON,
  },
  {
    href: "/empleado/reparacion-llantas",
    type: "REPARACION_LLANTAS",
    label: "Llantas",
    color: "from-[#f2a1c2] to-[#d5528a]",
    icon: LLANTAS_ICON,
  },
  {
    href: "/empleado/peaje",
    type: "PEAJE",
    label: "Peaje",
    color: "from-[#f28b82] to-[#c62828]",
    icon: PEAJE_ICON,
  },
  {
    href: "/empleado/otros",
    type: "OTROS",
    label: "Otros",
    color: "from-[#9ca3af] to-[#4b5563]",
    icon: OTROS_ICON,
  },
];

const CAJA_CHICA_OPTIONS: ExpenseCategoryOption[] = [
  {
    href: "/empleado/caja-chica",
    type: "CAJA_CHICA",
    label: "Caja chica",
    color: "from-[#4ade80] to-[#16a34a]",
    icon: CAJA_CHICA_ICON,
  },
];

const HOTEL_OPTIONS: ExpenseCategoryOption[] = [
  {
    href: "/empleado/hospedaje",
    type: "HOSPEDAJE",
    label: "Hospedaje",
    color: "from-[#a78bfa] to-[#6d28d9]",
    icon: HOSPEDAJE_ICON,
    allowMultiple: true,
  },
];

export function optionsForRole(role: UserRole): ExpenseCategoryOption[] {
  if (role === "CAJA_CHICA") return CAJA_CHICA_OPTIONS;
  if (role === "HOTEL") return HOTEL_OPTIONS;
  return EMPLOYEE_OPTIONS;
}

// Los tipos que cuentan como "reporte del día" en el tracker semanal y en
// la vista de un día. Para empleados, reparación de llantas queda afuera a
// propósito (no es una rutina diaria como comida/kilometraje). Caja chica y
// Hotel solo tienen una categoría cada uno — su meta diaria es 1, no 4 — así
// el aro nunca queda en amarillo sin poder llegar a verde.
export function dailyTypesForRole(role: UserRole): ExpenseType[] {
  if (role === "CAJA_CHICA") return ["CAJA_CHICA"];
  if (role === "HOTEL") return ["HOSPEDAJE"];
  return ["DESAYUNO", "ALMUERZO", "CENA", "KILOMETRAJE"];
}
