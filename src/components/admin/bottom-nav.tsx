"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDict } from "@/i18n/locale-provider";

// Mismo patrón que EmployeeBottomNav — barra fija abajo, todo visible de
// una, sin deslizar. Reemplaza la fila de pestañas con scroll horizontal
// que tenía Admin en celular; en escritorio no se muestra (ahí sigue el
// menú lateral de AdminNav).
export function AdminBottomNav() {
  const pathname = usePathname();
  const dict = useDict();

  const items = [
    {
      href: "/admin",
      label: dict.admin.nav.dashboard,
      icon: (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
      ),
    },
    {
      href: "/admin/gastos",
      label: dict.admin.nav.gastos,
      icon: (
        <>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <circle cx="16.5" cy="14.5" r="1.2" />
        </>
      ),
    },
    {
      href: "/admin/empleados",
      label: dict.admin.nav.usuarios,
      icon: (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
          <circle cx="18" cy="9" r="2.2" />
          <path d="M15.7 13.5a4.5 4.5 0 0 1 4.8 4.5" />
        </>
      ),
    },
    {
      href: "/admin/reportes",
      label: dict.admin.nav.reportes,
      icon: (
        <>
          <path d="M7 3h7l4 4v14H7Z" />
          <path d="M9 11h6M9 15h6" />
        </>
      ),
    },
    {
      href: "/admin/configuracion",
      label: dict.admin.nav.configuracion,
      icon: (
        <>
          <path d="M4 6h10M4 12h16M4 18h10" />
          <circle cx="17" cy="6" r="2" />
          <circle cx="8" cy="18" r="2" />
        </>
      ),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-brand" : "text-foreground-muted",
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
