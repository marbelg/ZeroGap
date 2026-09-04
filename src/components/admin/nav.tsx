"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDict } from "@/i18n/locale-provider";

export function AdminNav() {
  const pathname = usePathname();
  const dict = useDict();

  const items = [
    { href: "/admin", label: dict.admin.nav.dashboard },
    { href: "/admin/gastos", label: dict.admin.nav.gastos },
    { href: "/admin/empleados", label: dict.admin.nav.usuarios },
    { href: "/admin/reportes", label: dict.admin.nav.reportes },
    { href: "/admin/configuracion", label: dict.admin.nav.configuracion },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "w-full rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium transition-colors",
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
