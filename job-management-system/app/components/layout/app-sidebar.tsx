"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth/roles";

interface NavItem {
  href: string;
  label: string;
  /** Roles that can see this link. Omit to show to every staff role. */
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/customers", label: "Customers", roles: ["admin", "manager", "sales"] },
  { href: "/quotes", label: "Quotes", roles: ["admin", "manager", "sales"] },
  { href: "/invoices", label: "Invoices", roles: ["admin", "manager", "sales"] },
  { href: "/products", label: "Products", roles: ["admin", "manager", "sales", "technician"] },
  { href: "/suppliers", label: "Suppliers", roles: ["admin", "manager"] },
  { href: "/audit-log", label: "Audit log", roles: ["admin", "manager"] },
];

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
