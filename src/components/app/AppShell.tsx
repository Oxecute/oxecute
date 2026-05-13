"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  summaryPanel,
  inlineRightRail,
  unreadCount = 0,
}: {
  user: AppShellUser;
  breadcrumb?: string;
  children: React.ReactNode;
  summaryPanel?: React.ReactNode;
  inlineRightRail?: React.ReactNode;
  unreadCount?: number;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [hoverSummary, setHoverSummary] = useState(false);
  const [pinnedSummary, setPinnedSummary] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const summaryWrapRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tick, setTick] = useState(0);
  const [flyoutRightPx, setFlyoutRightPx] = useState(12);

  const syncFlyoutToBell = useCallback(() => {
    const btn = bellRef.current;
    if (!btn || typeof window === "undefined") return;
    const r = btn.getBoundingClientRect();
    setFlyoutRightPx(Math.max(8, Math.round(window.innerWidth - r.right)));
  }, []);

  useEffect(() => {
    syncFlyoutToBell();
    window.addEventListener("resize", syncFlyoutToBell);
    return () => window.removeEventListener("resize", syncFlyoutToBell);
  }, [syncFlyoutToBell]);

  const cancelHoverClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openSummaryHover = useCallback(() => {
    cancelHoverClose();
    syncFlyoutToBell();
    setHoverSummary(true);
  }, [cancelHoverClose, syncFlyoutToBell]);

  const scheduleCloseHover = useCallback(() => {
    cancelHoverClose();
    closeTimerRef.current = setTimeout(() => setHoverSummary(false), 340);
  }, [cancelHoverClose]);

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

  useEffect(() => {
    if (!pinnedSummary) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (summaryWrapRef.current?.contains(t)) return;
      if (flyoutRef.current?.contains(t)) return;
      setPinnedSummary(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pinnedSummary]);

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

  const desktopFlyoutOpen = hoverSummary || pinnedSummary;

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
        {summaryPanel ? (
          <div ref={summaryWrapRef} className="relative z-40 shrink-0">
            <button
              ref={bellRef}
              type="button"
              className="relative p-2 rounded-lg hover:bg-[var(--sur2)] text-[var(--t2)]"
              aria-label="Open journey summary (right sidebar)"
              aria-expanded={desktopFlyoutOpen}
              aria-controls="summary-flyout"
              onMouseEnter={openSummaryHover}
              onMouseLeave={scheduleCloseHover}
              onClick={() => {
                if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                  setMobileSummaryOpen(true);
                  return;
                }
                syncFlyoutToBell();
                setPinnedSummary((p) => !p);
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : null}
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

      {summaryPanel ? (
        <aside
          ref={flyoutRef}
          id="summary-flyout"
          style={{ right: flyoutRightPx }}
          className={`hidden md:block fixed top-12 z-[45] w-[min(272px,calc(100vw-0.75rem))] max-h-[calc(100vh-3rem)] overflow-y-auto overflow-x-hidden scrollbar-none shadow-[-12px_0_24px_rgba(1,2,97,0.07)] border-l border-y border-[var(--bdr)] md:rounded-l-2xl bg-[var(--sur)] p-3 pb-6 transition-opacity duration-150 ease-out ${
            desktopFlyoutOpen
              ? "opacity-100 visible pointer-events-auto"
              : "opacity-0 invisible pointer-events-none"
          }`}
          onMouseEnter={openSummaryHover}
          onMouseLeave={scheduleCloseHover}
        >
          {summaryPanel}
        </aside>
      ) : null}

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
              <DashboardNav
                user={user}
                inboxUnread={unreadCount}
                onNavigate={() => setMobileNav(false)}
              />
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

      {summaryPanel && mobileSummaryOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close summary"
            onClick={() => setMobileSummaryOpen(false)}
          />
          <aside className="absolute right-0 top-0 bottom-0 w-[min(300px,92vw)] overflow-y-auto overflow-x-hidden scrollbar-none border-l border-[var(--bdr)] bg-[var(--sur)] shadow-xl p-3">
            {summaryPanel}
          </aside>
        </div>
      ) : null}

      <div
        className={`mx-auto px-4 py-6 md:py-8 grid gap-6 lg:gap-8 ${
          inlineRightRail
            ? "max-w-[1320px] md:grid-cols-[200px_1fr_minmax(252px,280px)]"
            : "max-w-5xl md:grid-cols-[200px_1fr]"
        }`}
      >
        <aside className="hidden md:block space-y-2">
          <DashboardNav user={user} inboxUnread={unreadCount} />
        </aside>
        <div className="min-w-0">{children}</div>
        {inlineRightRail ? (
          <aside className="hidden md:block min-w-0 border-l border-[var(--bdr)] pl-4 lg:pl-5 self-start sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-none">
            {inlineRightRail}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
