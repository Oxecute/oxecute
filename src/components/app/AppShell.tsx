"use client";

import { useState } from "react";

import { useBreakpointMd } from "@/hooks/useBreakpointMd";

import { DashboardNav, DashboardNavLogo, type MeUser } from "./DashboardNav";
import { MobileShellRailDrawer } from "./MobileShellRailDrawer";

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

const COLS_WITH_RAIL =
  "md:grid-cols-[minmax(232px,260px)_minmax(0,1fr)_minmax(288px,360px)] lg:grid-cols-[minmax(248px,280px)_minmax(0,1fr)_minmax(300px,380px)]";

/** L-layout: tighter rail so the center column reads as primary. */
const COLS_WITH_RAIL_L =
  "md:grid-cols-[minmax(228px,252px)_minmax(0,1fr)_minmax(248px,288px)] lg:grid-cols-[minmax(236px,260px)_minmax(0,1fr)_minmax(260px,300px)]";

const HAIRLINE_V = "md:border-r md:border-white/[0.09]";

/** L-shell: row 1 = logo above nav | record header above main; row 2 = nav | main | rail. */
const LSHAPE_GRID = `grid-rows-[auto_minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)] ${COLS_WITH_RAIL_L} gap-0`;

/** One connected surface: soft outer rim, no gutters between regions. */
const L_UNIFIED_SHELL =
  "rounded-[22px] sm:rounded-[26px] md:rounded-[28px] border border-white/[0.06] bg-[var(--shell-bg)] shadow-[0_2px_28px_rgba(0,0,0,0.38)] overflow-hidden";

export function AppShell({
  user,
  children,
  inlineRightRail,
  /** When set with `inlineRightRail`, row 1 is logo (col 1) + header (cols 2–3); row 2 is nav | main | rail. */
  lHeader,
  unreadCount = 0,
}: {
  user: AppShellUser;
  children: React.ReactNode;
  inlineRightRail?: React.ReactNode;
  lHeader?: React.ReactNode;
  unreadCount?: number;
}) {
  const [mobileNav, setMobileNav] = useState(false);
  const useLShape = Boolean(lHeader && inlineRightRail);
  const mdUp = useBreakpointMd();

  const outerGridClass =
    inlineRightRail
      ? `max-w-[1920px] px-3 sm:px-4 md:px-5 lg:px-7 pt-14 pb-5 md:pt-6 md:pb-7 grid mx-auto ${
          useLShape ? "" : `${COLS_WITH_RAIL} ${COL_GAP}`
        }`
      : `max-w-5xl px-3 sm:px-4 md:px-5 lg:px-7 pt-14 pb-5 md:pt-6 md:pb-7 grid ${COL_GAP} mx-auto md:grid-cols-[minmax(228px,260px)_minmax(0,1fr)]`;

  const navAside = !useLShape ? (
    <aside
      className={`hidden md:flex pt-5 pb-5 px-5 lg:pt-6 lg:pb-6 lg:px-6 bg-[var(--sur2)] ${COL_STICKY} ${COL_NAV_PANEL} min-w-0`}
    >
      <DashboardNav
        user={user}
        inboxUnread={unreadCount}
        className="flex-1 min-h-0"
        sidebarScroll
      />
    </aside>
  ) : null;

  /** Row 1 col 1: Logo-04 only — shares bottom edge with record header; title starts col 2 after nav/main divider. */
  const logoBandL = useLShape ? (
    <div
      className={
        "hidden md:flex flex-row items-center self-stretch min-w-0 min-h-0 " +
        "bg-[#0B0F14] border-b border-[#1F2430] " +
        "px-5 lg:px-6 py-4 " +
        `${HAIRLINE_V} md:col-start-1 md:row-start-1`
      }
    >
      <DashboardNavLogo />
    </div>
  ) : null;

  const navLinksAsideL = useLShape ? (
    <aside
      className={
        "hidden md:flex flex-col min-w-0 min-h-0 h-full max-h-full overflow-hidden " +
        "bg-[var(--nav-surface)] px-5 pb-5 pt-2 lg:px-6 lg:pb-6 " +
        `${HAIRLINE_V} md:col-start-1 md:row-start-2`
      }
    >
      <DashboardNav
        user={user}
        inboxUnread={unreadCount}
        className="flex-1 min-h-0"
        hideLogo
        sidebarScroll={false}
      />
    </aside>
  ) : null;

  const headerCell =
    useLShape && lHeader ? (
      <div
        className={
          "min-w-0 min-h-0 shrink-0 col-span-full md:col-span-2 md:col-start-2 md:row-start-1 " +
          "border-0 shadow-none rounded-none bg-transparent p-0 flex items-stretch overflow-hidden"
        }
      >
        {lHeader}
      </div>
    ) : null;

  /** L-shape: only the main column scrolls; nav, header, rail stay fixed in the shell. */
  const mainCol = (
    <div
      className={
        useLShape
          ? `min-w-0 min-h-0 h-full max-h-full border-0 shadow-none rounded-none bg-[var(--shell-bg)] overflow-y-auto overscroll-y-contain overflow-x-hidden scrollbar-none md:col-start-2 md:row-start-2 ${HAIRLINE_V}`
          : `min-w-0 ${COL_STICKY} ${COL_MAIN} bg-[var(--shell-bg)]`
      }
    >
      {children}
    </div>
  );

  const railAside = inlineRightRail ? (
    <aside
      className={
        useLShape
          ? "hidden md:flex flex-col min-w-0 min-h-0 h-full border-0 shadow-none rounded-none bg-[var(--shell-bg)] pl-4 pr-4 pt-4 pb-4 lg:pl-5 lg:pr-5 md:col-start-3 md:row-start-2 overflow-hidden"
          : `hidden md:block ${COL_STICKY} ${COL_RAIL} bg-[var(--sur2)] p-5 lg:p-[22px]`
      }
    >
      {inlineRightRail}
    </aside>
  ) : null;

  const gridBody = useLShape ? (
    <>
      {logoBandL}
      {headerCell}
      {navLinksAsideL}
      {mainCol}
      {railAside}
    </>
  ) : (
    <>
      {navAside}
      {headerCell}
      {mainCol}
      {railAside}
    </>
  );

  return (
    <div
      className={
        useLShape
          ? "h-dvh max-h-dvh w-full min-w-0 overflow-x-hidden overflow-hidden flex flex-col bg-[var(--mi)] text-[var(--t1)]"
          : "min-h-screen w-full min-w-0 max-w-[100vw] overflow-x-hidden bg-[var(--mi)] text-[var(--t1)]"
      }
    >
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
        <div className="fixed inset-0 z-[60] md:hidden">
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

      {useLShape ? (
        <div className="flex flex-1 min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden px-3 sm:px-4 md:px-5 lg:px-7 pt-14 pb-5 md:pt-6 md:pb-7">
          {mdUp ? (
            <div
              className={`max-w-[1920px] mx-auto w-full min-w-0 h-full min-h-0 grid ${LSHAPE_GRID} ${L_UNIFIED_SHELL}`}
            >
              {gridBody}
            </div>
          ) : (
            <div className="mx-auto flex h-full min-h-0 min-w-0 w-full max-w-[1920px] flex-1 flex-col">
              <div
                className={`flex h-full min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden ${L_UNIFIED_SHELL}`}
              >
                <div className="flex min-w-0 shrink-0 items-center border-b border-[#1F2430] bg-[#0B0F14] px-4 py-3">
                  <DashboardNavLogo />
                </div>
                <div className="min-w-0 shrink-0">{lHeader}</div>
                <div className="min-h-0 min-w-0 w-full max-w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain scrollbar-none bg-[var(--shell-bg)]">
                  {children}
                </div>
                <MobileShellRailDrawer>{inlineRightRail}</MobileShellRailDrawer>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`w-full min-w-0 max-w-[100vw] ${outerGridClass}`}>{gridBody}</div>
      )}
    </div>
  );
}
