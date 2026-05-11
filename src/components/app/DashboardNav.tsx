"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "./dashboard-nav-config";
import { DASHBOARD_NAV_REST } from "./dashboard-nav-config";

export type MeUser = {
  username: string;
  full_name?: string;
  execution_count?: number;
  day7_reached?: boolean;
  day21_reached?: boolean;
  day21_unlocked?: boolean;
  day45_reached?: boolean;
};

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function showLockpill(item: NavItem, user: MeUser): string | null {
  if (item.href === "/signal" || item.href === "/directive") {
    if (!user.day21_reached) return item.lockLabel ?? "Locked";
  }
  if (item.href === "/community") {
    if (!user.day45_reached) return item.lockLabel ?? "Locked";
  }
  if (item.href === "/coaches" || item.href === "/angels") {
    return item.lockLabel ?? "Coming Soon";
  }
  return null;
}

export function DashboardNav({
  user,
  items,
  onNavigate,
  className = "",
}: {
  user: MeUser;
  items?: NavItem[];
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const navItems: NavItem[] = items ?? [
    { label: "My Profile", href: "/settings/profile" },
    ...DASHBOARD_NAV_REST,
  ];

  return (
    <nav className={`space-y-1 text-sm ${className}`}>
      {navItems.map((item) => {
        const active =
          item.href === "/settings/profile"
            ? pathname === "/settings/profile" || pathname.startsWith("/settings/")
            : navActive(pathname, item.href);
        const pill = showLockpill(item, user);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 py-2 px-2 rounded-lg ${
              active
                ? "bg-[var(--sur2)] text-[var(--p)] font-semibold"
                : "text-[var(--t2)] hover:bg-[var(--sur2)] hover:text-[var(--p)]"
            }`}
          >
            <span>{item.label}</span>
            {pill ? (
              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--t3)] border border-[var(--bdr)] rounded-full px-2 py-0.5">
                {pill}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
