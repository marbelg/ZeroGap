"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/gastos", label: "Gastos" },
  { href: "/admin/empleados", label: "Empleados" },
  { href: "/admin/reportes", label: "Reportes" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-1">
      {items.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium transition-colors md:w-full",
              active
                ? "bg-brand-soft text-brand"
                : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
