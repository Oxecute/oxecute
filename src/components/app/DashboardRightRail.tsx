"use client";

import Link from "next/link";
import { useContext } from "react";

import { InboxUnreadContext, useShellUser } from "./AuthenticatedShell";

function Section({
  title,
  children,
  tight,
}: {
  title: string;
  children: React.ReactNode;
  tight: boolean;
}) {
  return (
    <section className={tight ? "py-2 first:pt-0" : "py-4 first:pt-0"}>
      <h3
        className={`font-semibold text-[var(--t3)] uppercase tracking-[0.14em] ${
          tight ? "text-[9px] mb-2" : "text-[10px] mb-3"
        }`}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function IconBox({
  children,
  className = "",
  tight,
}: {
  children: React.ReactNode;
  className?: string;
  tight: boolean;
}) {
  const sz = tight ? "w-6 h-6" : "w-8 h-8";
  return (
    <span
      className={`shrink-0 ${sz} rounded-full flex items-center justify-center border border-[var(--bdr)] bg-[var(--sur2)] text-[var(--t2)] [&_svg]:shrink-0 ${className}`}
    >
      {children}
    </span>
  );
}

function NotifyRow({
  icon,
  title,
  meta,
  tight,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  tight: boolean;
}) {
  return (
    <div className={`flex ${tight ? "gap-2" : "gap-3"}`}>
      {icon}
      <div className="min-w-0">
        <p
          className={`font-medium text-[var(--t1)] leading-snug ${
            tight ? "text-[11px] line-clamp-2" : "text-[13px]"
          }`}
        >
          {title}
        </p>
        <p className={`text-[var(--t3)] ${tight ? "text-[10px] mt-0.5" : "text-[11px] mt-0.5"}`}>{meta}</p>
      </div>
    </div>
  );
}

function NotificationsBlock({ tight }: { tight: boolean }) {
  const user = useShellUser();
  const inboxUnread = useContext(InboxUnreadContext);
  const exec = Number(user.execution_count ?? 0);
  const day21 = Boolean(user.day21_reached);
  const nextDay = Math.max(1, exec + 1);
  const iw = tight ? 13 : 15;
  const iw2 = tight ? 14 : 16;

  return (
    <>
      <Section title="Notifications" tight={tight}>
        <ul className="rounded-lg border border-[var(--bdr)] overflow-hidden bg-[var(--sur2)]/50">
          <li className={`border-b border-[var(--bdr)] last:border-b-0 ${tight ? "p-2" : "p-3"}`}>
            <NotifyRow
              tight={tight}
              icon={
                <IconBox tight={tight} className="text-amber-600 dark:text-amber-400">
                  <svg width={iw2} height={iw2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M18 7h3v3a3 3 0 01-3 3h-1M6 7H3v3a3 3 0 003 3h1M12 8c-1.66 0-3 1.34-3 3v2h6v-2c0-1.66-1.34-3-3-3z" strokeLinecap="round" />
                    <path d="M12 16v4M8 22h8" strokeLinecap="round" />
                  </svg>
                </IconBox>
              }
              title={`Record started · Day ${Math.max(1, exec)}`}
              meta="Just now"
            />
          </li>
          <li className={`border-b border-[var(--bdr)] last:border-b-0 ${tight ? "p-2" : "p-3"}`}>
            <NotifyRow
              tight={tight}
              icon={
                <IconBox tight={tight} className="text-[var(--p)]">
                  <span className={tight ? "text-[8px] font-bold" : "text-[10px] font-bold"}>Ox</span>
                </IconBox>
              }
              title="Welcome to Oxecute"
              meta="Just now"
            />
          </li>
          <li className={`border-b border-[var(--bdr)] last:border-b-0 ${tight ? "p-2" : "p-3"}`}>
            {!day21 ? (
              <NotifyRow
                tight={tight}
                icon={
                  <IconBox tight={tight}>
                    <svg width={iw} height={iw} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </IconBox>
                }
                title={`Day ${nextDay} directive · midnight UTC`}
                meta="Automated"
              />
            ) : (
              <NotifyRow
                tight={tight}
                icon={
                  <IconBox tight={tight}>
                    <svg width={iw} height={iw} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </IconBox>
                }
                title="Daily Directive is live"
                meta="Nav"
              />
            )}
          </li>
        </ul>
      </Section>

      <div className={tight ? "py-2" : "py-3"}>
        <Link
          href="/inbox"
          className={`flex items-center gap-3 rounded-lg border border-[var(--bdr)] bg-[var(--sur2)] hover:bg-white/[0.04] transition-colors ${
            tight ? "px-3 py-2" : "px-3 py-2.5"
          }`}
        >
          <span className="shrink-0 text-[var(--t2)]" aria-hidden>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-6l-2 3H10L8 12H2" strokeLinejoin="round" />
              <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinejoin="round" />
            </svg>
          </span>
          <span className={`flex-1 font-medium text-[var(--t1)] ${tight ? "text-xs" : "text-sm"}`}>Inbox</span>
          {inboxUnread > 0 ? (
            <span
              className={`shrink-0 rounded-full bg-[var(--red)] text-white font-semibold tabular-nums ${
                tight ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1"
              }`}
            >
              {inboxUnread} unread
            </span>
          ) : (
            <span className={`shrink-0 text-[var(--t3)] ${tight ? "text-[10px]" : "text-xs"}`}>Open</span>
          )}
        </Link>
      </div>
    </>
  );
}

function journeyMilestones(exec: number) {
  const milestones = [
    { n: 1, label: "Day 1", done: exec >= 1 },
    { n: 21, label: "Day 21", done: exec >= 21 },
    { n: 60, label: "Day 60", done: exec >= 60 },
    { n: 90, label: "Day 90", done: exec >= 90 },
  ];
  const currentIdx =
    exec >= 90 ? 3 : exec >= 60 ? 2 : exec >= 21 ? 1 : exec >= 1 ? 0 : 0;
  return { milestones, currentIdx };
}

function MilestoneRings({
  milestones,
  currentIdx,
  tight,
}: {
  milestones: { n: number; label: string; done: boolean }[];
  currentIdx: number;
  tight: boolean;
}) {
  const lime = "border-[#c8f542] bg-[#c8f542] text-zinc-900";
  const done = "border-[#9ad936] bg-[#9ad936]/90 text-zinc-900";
  const up = "border-[var(--bdr)] text-[var(--t3)] bg-[var(--sur)]";
  const ring = tight ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[11px]";
  const labelCls = tight ? "text-[8px] mt-0.5" : "text-[10px] mt-1";

  return (
    <div className={`flex justify-between items-start ${tight ? "gap-0.5" : "gap-1"}`}>
      {milestones.map((m, i) => (
        <div key={m.n} className="flex flex-col items-center flex-1 min-w-0">
          <div
            className={`${ring} rounded-full flex items-center justify-center font-bold border-2 ${
              i <= currentIdx && m.done ? done : i === currentIdx ? lime : up
            }`}
          >
            {m.n}
          </div>
          <span className={`${labelCls} text-[var(--t3)] text-center leading-tight`}>{m.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Sticky right rail on desktop: notifications, inbox, journey summary. */
export function DashboardRightRail() {
  const user = useShellUser();

  const exec = Number(user.execution_count ?? 0);
  const day21 = Boolean(user.day21_reached);
  const day45 = Boolean(user.day45_reached);
  const { milestones, currentIdx } = journeyMilestones(exec);
  const nextDay = Math.max(1, exec + 1);
  const tight = false;

  return (
    <nav aria-label="Dashboard summary" className="divide-y divide-[var(--bdr)] pr-1 -mr-1 text-sm">
      <div className="pb-2 first:pt-0">
        <NotificationsBlock tight={tight} />
      </div>

      <Section title="Conexa directive" tight={tight}>
        <div className="rounded-lg border border-[var(--bdr)] bg-[var(--sur2)] p-3">
          <div className="flex gap-2.5">
            <svg
              className="shrink-0 text-[var(--t3)] mt-0.5 w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M12 15v2M8 11V7a4 4 0 018 0v4" />
            </svg>
            <div className="min-w-0">
              {day21 ? (
                <p className="text-xs text-[var(--t2)] leading-relaxed">
                  Directives on. Close each UTC window; the next directive follows midnight.
                </p>
              ) : (
                <>
                  <p className="text-[11px] text-[var(--t3)] leading-snug">Unlocks Day 21</p>
                  <p className="text-xs text-[var(--t2)] leading-relaxed mt-1.5">
                    Day {nextDay} directive generates at midnight <span className="whitespace-nowrap">UTC</span>.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Journey milestone" tight={tight}>
        <MilestoneRings milestones={milestones} currentIdx={currentIdx} tight={tight} />
        <p className="text-xs text-[var(--t2)] leading-relaxed mt-3">Day 21: Directives and Signal Score.</p>
      </Section>

      <Section title="Signal score" tight={tight}>
        {day21 ? (
          <p className="text-xs text-[var(--t2)] leading-relaxed">Builder tier post Day 21. UI Month 2.</p>
        ) : (
          <>
            <p className="text-2xl font-semibold text-[var(--t3)] mb-1">—</p>
            <p className="text-xs text-[var(--t2)]">Day 21 · Operator tier.</p>
          </>
        )}
      </Section>

      <Section title="Investor visibility" tight={tight}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--t3)] shrink-0" aria-hidden />
          <span className="text-sm font-medium text-[var(--t1)]">Not Active</span>
        </div>
        <p className="text-[11px] text-[var(--t3)] leading-relaxed mt-2">
          Day 60, 70%+ execution, Score 45+, Pathfinder.
        </p>
      </Section>

      <Section title="Building alongside you" tight={tight}>
        {day45 ? (
          <p className="text-xs text-[var(--t2)] leading-relaxed">Community directory · post-MVP.</p>
        ) : (
          <p className="text-xs text-[var(--t2)] leading-relaxed">
            <span className="inline-flex items-center rounded border border-[var(--bdr)] px-1.5 py-0.5 text-[9px] uppercase mr-1.5 text-[var(--t3)]">
              Day 45
            </span>
            Unlocks at 45 days executed.
          </p>
        )}
      </Section>
    </nav>
  );
}
