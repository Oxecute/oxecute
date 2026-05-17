"use client";

import type { ReactNode } from "react";

import { useShellUser } from "./AuthenticatedShell";

function Section({
  title,
  children,
  tight,
}: {
  title: string;
  children: ReactNode;
  tight: boolean;
}) {
  return (
    <section className={tight ? "py-2 first:pt-0" : "py-3 first:pt-0"}>
      <h3
        className={`font-medium uppercase tracking-[0.12em] text-zinc-500 ${
          tight ? "text-[8px] mb-1.5" : "text-[9px] mb-2"
        }`}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function journeyMilestones(exec: number) {
  const milestones = [
    { n: 1, label: "Day 1", done: exec >= 1 },
    { n: 21, label: "Day 21", done: exec >= 21 },
    { n: 45, label: "Day 45", done: exec >= 45 },
    { n: 60, label: "Day 60", done: exec >= 60 },
    { n: 90, label: "Day 90", done: exec >= 90 },
  ];
  const currentIdx =
    exec >= 90 ? 4 : exec >= 60 ? 3 : exec >= 45 ? 2 : exec >= 21 ? 1 : exec >= 1 ? 0 : 0;
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
  const active =
    "border-[#0EA472]/90 bg-[#0EA472]/90 text-white ring-1 ring-[#0EA472]/25";
  const done = "border-[#0c8f5f]/85 bg-[#0c8f5f]/80 text-white";
  const up = "border-white/[0.06] text-zinc-500 bg-white/[0.03]";
  const ring = tight ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[11px]";
  const labelCls = tight ? "text-[8px] mt-0.5" : "text-[10px] mt-1";

  return (
    <div className={`flex justify-between items-start ${tight ? "gap-0.5" : "gap-1"}`}>
      {milestones.map((m, i) => (
        <div key={m.n} className="flex flex-col items-center flex-1 min-w-0">
          <div
            className={`${ring} rounded-full flex items-center justify-center font-bold border-2 ${
              i <= currentIdx && m.done ? done : i === currentIdx ? active : up
            }`}
          >
            {m.n}
          </div>
          <span className={`${labelCls} text-zinc-500 text-center leading-tight`}>{m.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Sticky right rail on desktop: Conexa summary and journey milestones. */
export function DashboardRightRail() {
  const user = useShellUser();

  const exec = Number(user.execution_count ?? 0);
  const day21 = Boolean(user.day21_reached);
  const day45 = Boolean(user.day45_reached);
  const { milestones, currentIdx } = journeyMilestones(exec);
  const nextDay = Math.max(1, exec + 1);
  const tight = false;

  return (
    <nav aria-label="Dashboard summary" className="divide-y divide-white/[0.04] text-[13px] text-zinc-500 max-w-full">
      <Section title="Conexa directive" tight={tight}>
        <div className="rounded-md border border-white/[0.045] bg-white/[0.025] p-2.5">
          <div className="flex gap-2.5">
            <svg
              className="shrink-0 text-zinc-500 mt-0.5 w-3.5 h-3.5"
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
                <p className="text-[11px] text-zinc-500/90 leading-relaxed">
                  Directives on. Close each UTC window; the next directive follows midnight.
                </p>
              ) : (
                <>
                  <p className="text-[10px] text-zinc-500 leading-snug">Unlocks at 21 days executed</p>
                  <p className="text-[11px] text-zinc-500/90 leading-relaxed mt-1">
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
        <p className="text-[11px] text-zinc-500/85 leading-relaxed mt-2.5">Day 21: Signal Score, Daily Directive, and 5 more Conexa tabs unlock.</p>
      </Section>

      <Section title="Building alongside you" tight={tight}>
        {day45 ? (
          <p className="text-[11px] text-zinc-500/90 leading-relaxed">Community directory · post-MVP.</p>
        ) : (
          <p className="text-[11px] text-zinc-500/90 leading-relaxed">
            <span className="inline-flex items-center rounded border border-white/[0.06] px-1.5 py-0.5 text-[8px] uppercase mr-1.5 text-zinc-500">
              Day 45
            </span>
            Unlocks at 45 days executed.
          </p>
        )}
      </Section>
    </nav>
  );
}
