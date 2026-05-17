"use client";

import { useShellUser } from "./AuthenticatedShell";

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

/** Sticky right rail on desktop (no notifications block). */
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
      <Section title="Conexa directive" tight={tight}>
        <div className="rounded-lg border border-[var(--bdr)] bg-[var(--sur2)] flex gap-2 p-3">
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
          <p className="text-xs text-[var(--t2)] leading-relaxed">
            {day21 ? (
              <>Directives on. Close each UTC window; the next directive follows midnight.</>
            ) : (
              <>
                Unlocks Day 21. Day {nextDay} directive generates at midnight{" "}
                <span className="whitespace-nowrap">UTC</span>.
              </>
            )}
          </p>
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
