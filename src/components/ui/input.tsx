import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-[15px] text-foreground placeholder:text-foreground-muted outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-foreground-muted outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-[15px] text-foreground outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-foreground-muted", className)}
      {...props}
    />
  );
}
