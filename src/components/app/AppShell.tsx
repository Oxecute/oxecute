"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardNav, type MeUser } from "./DashboardNav";
import { formatCountdown, getUtcWindowRemainingParts } from "./utc-countdown";

export type AppShellUser = MeUser & {
  full_name?: string;
  created_at?: string;
  conexa_day1_report?: Record<string, unknown> | null;
  last_submission_date?: string | null;
  break_count?: number;
  founding_member?: boolean;
};

export function AppShell({
  user,
  breadcrumb = "Dashboards / Founder Operating Record",
  children,
  rightRail,
  unreadCount = 0,
}: {
  user: AppShellUser;
  breadcrumb?: string;
  children: React.ReactNode;
  rightRail?: React.ReactNode;
  unreadCount?: number;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mobileNav, setMobileNav] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  void tick;

  useEffect(() => {
    if (!accountOpen) return;
    function close(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [accountOpen]);

  const clock = new Date().toISOString().slice(11, 19);
  const win = formatCountdown(getUtcWindowRemainingParts());

  const initials = String(user.full_name ?? user.username ?? "?")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const exec = Math.min(100, Math.max(0, Number(user.execution_count ?? 0) * 5));
  const avatarBg =
    exec >= 75
      ? "bg-[var(--p)]"
      : exec >= 50
        ? "bg-[var(--na)]"
        : exec >= 25
          ? "bg-[var(--t2)]"
          : "bg-[var(--t3)]";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="sticky top-0 z-20 h-12 flex items-center px-3 md:px-4 border-b border-[var(--bdr)] bg-[var(--sur)] gap-3 text-sm">
        <button
          type="button"
          className="md:hidden p-2 -ml-1 rounded-lg border border-[var(--bdr)] text-[var(--t2)]"
          aria-label="Open menu"
          onClick={() => setMobileNav(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="font-bold text-[var(--p)] shrink-0">
          O<span className="text-[var(--ac)]">x</span>ecute
        </Link>
        <span className="hidden sm:inline text-[var(--t3)] truncate text-xs md:text-sm">
          {breadcrumb}
        </span>
        <span className="hidden lg:inline ml-auto text-xs text-[var(--t2)] tabular-nums">
          Window {win}
        </span>
        <span className="lg:ml-0 ml-auto text-xs text-[var(--t2)] tabular-nums">
          {clock} UTC
        </span>
        <Link
          href="/inbox"
          className="relative p-2 rounded-lg hover:bg-[var(--sur2)] text-[var(--t2)]"
          aria-label="Inbox"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--red)]" />
          ) : null}
        </Link>
        <div className="relative shrink-0" ref={accountRef}>
          <button
            type="button"
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[var(--fw)] ${avatarBg} focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sur)]`}
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
            onClick={() => setAccountOpen((o) => !o)}
          >
            {initials}
          </button>
          {accountOpen ? (
            <div
              className="absolute right-0 top-[calc(100%+6px)] w-44 rounded-xl border border-[var(--bdr)] bg-[var(--sur)] shadow-lg py-1 z-50 text-left"
              role="menu"
            >
              <Link
                href="/settings/profile"
                role="menuitem"
                className="block px-3 py-2.5 text-sm text-[var(--t1)] hover:bg-[var(--sur2)]"
                onClick={() => setAccountOpen(false)}
              >
                Profile
              </Link>
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3 py-2.5 text-sm text-[var(--t1)] hover:bg-[var(--sur2)]"
                onClick={async () => {
                  setAccountOpen(false);
                  await supabase.auth.signOut();
                  router.push("/login");
                  router.refresh();
                }}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {mobileNav ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[min(280px,85vw)] bg-[var(--sur)] border-r border-[var(--bdr)] p-4 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0">
              <DashboardNav user={user} onNavigate={() => setMobileNav(false)} />
            </div>
            <div className="shrink-0 pt-3 mt-3 border-t border-[var(--bdr)] space-y-1">
              <Link
                href="/settings/profile"
                className="block py-2 px-2 rounded-lg text-sm text-[var(--t1)] hover:bg-[var(--sur2)]"
                onClick={() => setMobileNav(false)}
              >
                Profile
              </Link>
              <button
                type="button"
                className="w-full text-left py-2 px-2 rounded-lg text-sm text-[var(--t1)] hover:bg-[var(--sur2)]"
                onClick={async () => {
                  setMobileNav(false);
                  await supabase.auth.signOut();
                  router.push("/login");
                  router.refresh();
                }}
              >
                Log out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div
        className={`mx-auto px-4 py-6 md:py-8 ${
          rightRail
            ? "max-w-[1280px] grid md:grid-cols-[200px_1fr_236px] gap-6 lg:gap-8"
            : "max-w-5xl grid md:grid-cols-[200px_1fr] gap-6 lg:gap-8"
        }`}
      >
        <aside className="hidden md:block space-y-2">
          <DashboardNav user={user} />
        </aside>
        <div className="min-w-0">{children}</div>
        {rightRail ? (
          <>
            <aside className="hidden md:block min-w-[236px] max-w-[236px]">{rightRail}</aside>
            <div className="md:hidden col-span-full border-t border-[var(--bdr)] pt-6">
              {rightRail}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
