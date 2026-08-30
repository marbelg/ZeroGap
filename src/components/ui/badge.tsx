import { cn } from "@/lib/utils";
import type { ExpenseStatus, UserStatus } from "@/types/database";

const expenseStatusClasses: Record<ExpenseStatus, string> = {
  REPORTADO: "bg-warning-soft text-warning",
  APROBADO: "bg-success-soft text-success",
  RECHAZADO: "bg-danger-soft text-danger",
};

const expenseStatusLabel: Record<ExpenseStatus, string> = {
  REPORTADO: "Reportado",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        expenseStatusClasses[status],
      )}
    >
      {expenseStatusLabel[status]}
    </span>
  );
}

const userStatusClasses: Record<UserStatus, string> = {
  ACTIVE: "bg-success-soft text-success",
  INACTIVE: "bg-surface-muted text-foreground-muted",
};

const userStatusLabel: Record<UserStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        userStatusClasses[status],
      )}
    >
      {userStatusLabel[status]}
    </span>
  );
}
