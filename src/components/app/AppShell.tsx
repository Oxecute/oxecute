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
  inlineRightRail,
  unreadCount = 0,
}: {
  user: AppShellUser;
  breadcrumb?: string;
  children: React.ReactNode;
  inlineRightRail?: React.ReactNode;
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
      <header className="sticky top-0 z-20 h-12 flex items-center px-3 md:px-4 border-b border-[var(--bdr)] bg-[#181B24] gap-3 text-sm">
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
        <Link href="/" className="shrink-0 flex items-center" aria-label="Oxecute home">
          <img
            src="/brand/logo-icon.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
            decoding="async"
          />
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
        <div className="relative z-30 shrink-0" ref={accountRef}>
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
                className="w-full text-left px-3 py-2.5 text-sm text-[#E24B4A] hover:bg-[var(--sur2)]"
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
          <aside className="absolute left-0 top-0 bottom-0 w-[min(280px,85vw)] bg-[#181B24] border-r border-[var(--bdr)] p-3 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-none">
              <DashboardNav
                user={user}
                inboxUnread={unreadCount}
                onNavigate={() => setMobileNav(false)}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div
        className={`w-full max-w-none px-0 py-6 md:py-8 grid gap-5 lg:gap-6 ${
          inlineRightRail
            ? "md:grid-cols-[224px_1fr_minmax(296px,328px)] lg:grid-cols-[232px_1fr_minmax(304px,336px)]"
            : "max-w-5xl mx-auto md:grid-cols-[224px_1fr] px-4"
        }`}
      >
        <aside className="hidden md:block border-y border-r border-[var(--bdr)] border-l-0 bg-[#181B24] rounded-r-[20px] p-2.5 space-y-2 self-start sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-none">
          <DashboardNav user={user} inboxUnread={unreadCount} />
        </aside>
        <div className={`min-w-0 ${inlineRightRail ? "px-4 md:px-6 lg:px-7" : ""}`}>{children}</div>
        {inlineRightRail ? (
          <aside className="hidden md:block min-w-0 border-y border-l border-[var(--bdr)] border-r-0 bg-[var(--bg)] pl-4 lg:pl-5 pr-0 self-start sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-none">
            {inlineRightRail}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
