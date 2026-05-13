"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "./dashboard-nav-config";
import {
  NAV_DASHBOARD_ITEMS,
  NAV_PAGE_ITEMS,
  NAV_PROFILE_ITEMS,
  NAV_TOOL_ITEMS,
} from "./dashboard-nav-config";

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
    if (!user.day21_reached) return item.lockLabel ?? "Day 21";
  }
  if (item.href === "/community") {
    if (!user.day45_reached) return item.lockLabel ?? "Day 45";
  }
  if (item.href === "/coaches" || item.href === "/angels") {
    return item.lockLabel ?? "Day 60";
  }
  return null;
}

function NavSection({
  title,
  user,
  items,
  onNavigate,
  inboxUnread,
}: {
  title: string;
  user: MeUser;
  items: NavItem[];
  onNavigate?: () => void;
  inboxUnread: number;
}) {
  const pathname = usePathname();
  return (
    <div className="mb-1">
      <p className="text-[10px] font-semibold text-[var(--t3)] uppercase tracking-[0.12em] px-2 mb-1.5">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active =
            item.href === "/settings/profile"
              ? pathname === "/settings/profile" || pathname.startsWith("/settings/")
              : navActive(pathname, item.href);
          const pill = showLockpill(item, user);
          const isInbox = item.href === "/inbox";
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex flex-wrap items-center gap-x-2 gap-y-1 py-2 px-2 rounded-lg text-[13px] leading-snug ${
                active
                  ? "bg-[var(--sur2)] text-[var(--p)] font-semibold"
                  : "text-[var(--t2)] hover:bg-[var(--sur2)] hover:text-[var(--p)]"
              }`}
            >
              <span className="min-w-0 inline-flex items-center gap-1.5">
                {isInbox ? (
                  <>
                    <span>Inbox</span>
                    {inboxUnread > 0 ? (
                      <span className="text-[var(--red)] font-semibold tabular-nums">{inboxUnread}</span>
                    ) : null}
                  </>
                ) : (
                  item.label
                )}
              </span>
              {pill ? (
                <span className="text-[8px] font-medium tracking-wide text-[var(--t3)] normal-case">
                  coming soon
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardNav({
  user,
  items: _ignored,
  onNavigate,
  className = "",
  inboxUnread = 0,
}: {
  user: MeUser;
  items?: NavItem[];
  onNavigate?: () => void;
  className?: string;
  inboxUnread?: number;
}) {
  const initials = String(user.full_name ?? user.username ?? "?")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className={`text-sm ${className}`}>
      <NavSection
        title="Profile"
        user={user}
        items={NAV_PROFILE_ITEMS}
        onNavigate={onNavigate}
        inboxUnread={inboxUnread}
      />
      <NavSection
        title="Dashboards"
        user={user}
        items={NAV_DASHBOARD_ITEMS}
        onNavigate={onNavigate}
        inboxUnread={inboxUnread}
      />
      <NavSection
        title="Pages"
        user={user}
        items={NAV_PAGE_ITEMS}
        onNavigate={onNavigate}
        inboxUnread={inboxUnread}
      />
      <NavSection
        title="Tools"
        user={user}
        items={NAV_TOOL_ITEMS}
        onNavigate={onNavigate}
        inboxUnread={inboxUnread}
      />

      <div className="mt-6 pt-4 border-t border-[var(--bdr)] flex items-center gap-3 px-2">
        <div className="w-9 h-9 rounded-full bg-[var(--p)] text-[var(--fw)] text-xs font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--t1)] truncate">
            {user.full_name ?? user.username}
          </p>
          <p className="text-[11px] text-[var(--t3)] truncate">@{user.username}</p>
        </div>
      </div>
    </nav>
  );
}
