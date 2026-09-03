import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ExpenseStatus, UserStatus } from "@/types/database";

const expenseStatusClasses: Record<ExpenseStatus, string> = {
  REPORTADO: "bg-warning-soft text-warning",
  APROBADO: "bg-success-soft text-success",
  RECHAZADO: "bg-danger-soft text-danger",
};

export function ExpenseStatusBadge({ status, dict }: { status: ExpenseStatus; dict: Dictionary }) {
  const expenseStatusLabel = dict.expenses.statusLabel;
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

export function UserStatusBadge({ status, dict }: { status: UserStatus; dict: Dictionary }) {
  const userStatusLabel = dict.expenses.userStatusLabel;
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
