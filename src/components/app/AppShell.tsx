"use client";

import { useState } from "react";

import { DashboardNav, type MeUser } from "./DashboardNav";

export type AppShellUser = MeUser & {
  full_name?: string;
  created_at?: string;
  conexa_day1_report?: Record<string, unknown> | null;
  last_submission_date?: string | null;
  break_count?: number;
  founding_member?: boolean;
};

/** Three-column shell: dark canvas + rounded nav / main / rail cards (product layout). */
const COL_GAP = "gap-4 md:gap-5 lg:gap-6";
/** Nav column shell: no vertical scroll here — clipping x would crop the wordmark. Scroll lives inside DashboardNav. */
const COL_NAV_PANEL =
  "rounded-2xl border border-[var(--bdr)] shadow-[0_10px_40px_rgba(0,0,0,0.35)] min-h-0 max-h-[calc(100dvh-1.75rem)] flex flex-col overflow-hidden";
const COL_MAIN =
  "rounded-2xl border border-[var(--bdr)] shadow-[0_10px_40px_rgba(0,0,0,0.35)] min-h-0 max-h-[calc(100dvh-1.75rem)] overflow-y-auto overflow-x-hidden scrollbar-none";
const COL_RAIL =
  "rounded-2xl border border-[var(--bdr)] shadow-[0_10px_40px_rgba(0,0,0,0.35)] min-h-0 max-h-[calc(100dvh-1.75rem)] overflow-y-auto scrollbar-none";
const COL_STICKY = "sticky top-4 md:top-5 self-start w-full min-w-0";

export function AppShell({
  user,
  children,
  inlineRightRail,
  unreadCount = 0,
}: {
  user: AppShellUser;
  children: React.ReactNode;
  inlineRightRail?: React.ReactNode;
  unreadCount?: number;
}) {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--mi)] text-[var(--t1)]">
      <button
        type="button"
        className="md:hidden fixed left-3 top-3 z-30 p-2.5 rounded-xl border border-[var(--bdr)] bg-[var(--sur2)] text-[var(--t2)] shadow-lg"
        aria-label="Open menu"
        onClick={() => setMobileNav(true)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileNav ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[min(300px,88vw)] flex flex-col max-h-[100dvh] rounded-r-2xl border-y border-r border-[var(--bdr)] bg-[var(--sur2)] shadow-[0_12px_48px_rgba(0,0,0,0.45)] py-6 pl-5 pr-4 overflow-hidden">
            <DashboardNav
              className="flex-1 min-h-0"
              user={user}
              inboxUnread={unreadCount}
              onNavigate={() => setMobileNav(false)}
            />
          </aside>
        </div>
      ) : null}

      <div
        className={`w-full min-w-0 max-w-[100vw] px-3 sm:px-4 md:px-5 lg:px-7 pt-14 pb-5 md:pt-6 md:pb-7 grid ${COL_GAP} mx-auto ${
          inlineRightRail
            ? `max-w-[1920px] md:grid-cols-[minmax(232px,260px)_minmax(0,1fr)_minmax(288px,360px)] lg:grid-cols-[minmax(248px,280px)_minmax(0,1fr)_minmax(300px,380px)]`
            : "max-w-5xl md:grid-cols-[minmax(228px,260px)_minmax(0,1fr)]"
        }`}
      >
        <aside
          className={`hidden md:flex ${COL_STICKY} ${COL_NAV_PANEL} bg-[var(--sur2)] p-5 lg:p-[22px]`}
        >
          <DashboardNav user={user} inboxUnread={unreadCount} className="flex-1 min-h-0" />
        </aside>
        <div className={`min-w-0 ${COL_STICKY} ${COL_MAIN} bg-[var(--shell-bg)]`}>{children}</div>
        {inlineRightRail ? (
          <aside className={`hidden md:block ${COL_STICKY} ${COL_RAIL} bg-[var(--sur2)] p-5 lg:p-[22px]`}>
            {inlineRightRail}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
