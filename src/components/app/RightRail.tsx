"use client";

import { useEffect, useState } from "react";

import type { MeUser } from "./DashboardNav";
import { formatCountdown, getUtcWindowRemainingParts } from "./utc-countdown";

export function RightRail({
  user,
}: {
  user: MeUser & { created_at?: string };
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  void tick;

  const parts = getUtcWindowRemainingParts();
  const countdown = formatCountdown(parts);

  const exec = Number(user.execution_count ?? 0);
  const day21 = Boolean(user.day21_reached);
  const day45 = Boolean(user.day45_reached);

  const milestones = [
    { n: 1, label: "Day 1", done: exec >= 1 },
    { n: 21, label: "Day 21", done: exec >= 21 },
    { n: 60, label: "Day 60", done: exec >= 60 },
    { n: 90, label: "Day 90", done: exec >= 90 },
  ];
  const currentIdx =
    exec >= 90 ? 3 : exec >= 60 ? 2 : exec >= 21 ? 1 : exec >= 1 ? 0 : 0;

  return (
    <div className="space-y-6 text-sm">
      <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4">
        <p className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wide mb-2">
          Window closes UTC
        </p>
        <p className="text-2xl font-bold tabular-nums text-[var(--t1)]">{countdown}</p>
        <p className="text-xs text-[var(--t3)] mt-1">Until 23:59:59 UTC today</p>
      </div>

      <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur2)] p-4 text-[var(--t2)]">
        {day21 ? (
          <p className="text-sm">
            Conexa: Daily Directive and deeper execution flows are live from your
            nav. Keep closing the window before UTC midnight.
          </p>
        ) : (
          <p className="text-sm">
            Conexa directive flow unlocks at Day 21. Your execution window closes at
            23:59:59 UTC.
          </p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-semibold text-[var(--t3)] uppercase tracking-widest mb-3">
          Journey milestone
        </p>
        <div className="flex justify-between items-start gap-1">
          {milestones.map((m, i) => (
            <div key={m.n} className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i <= currentIdx && m.done
                    ? "border-[var(--ac)] bg-[var(--ac)] text-[var(--mi)]"
                    : i === currentIdx
                      ? "border-[var(--ac)] text-[var(--fw)] bg-[var(--mi)]"
                      : "border-[var(--bdr)] text-[var(--t3)] bg-[var(--sur)]"
                }`}
              >
                {m.n === 1 ? 1 : m.n === 21 ? "21" : m.n === 60 ? "60" : "90"}
              </div>
              <span className="text-[10px] text-[var(--t3)] mt-1 text-center leading-tight">
                {m.label}
              </span>
            </div>
          ))}
        </div>
        {!day21 && (
          <div className="mt-3 rounded-lg bg-[rgba(34,197,94,0.12)] border border-[var(--green)]/30 p-3 text-xs text-[var(--t2)]">
            Day 21: Signal Score, Daily Directive, and 5 more Conexa tabs unlock.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4">
        <p className="text-[10px] font-semibold text-[var(--t3)] uppercase tracking-widest mb-2">
          Signal score
        </p>
        {day21 ? (
          <p className="text-[var(--t2)] text-sm">
            Unlocks with Builder tier after Day 21 gate. Score UI ships Month 2 per MVP
            scope.
          </p>
        ) : (
          <>
            <p className="text-3xl font-bold text-[var(--t3)]">…</p>
            <p className="text-xs text-[var(--t3)] mt-2">
              Unlocks at Day 21 · Operator tier required.
            </p>
            <p className="text-xs text-[var(--t2)] mt-2">
              You&apos;re on {exec} days executed · {Math.max(0, 21 - exec)} to go.
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4">
        <p className="text-[10px] font-semibold text-[var(--t3)] uppercase tracking-widest mb-2">
          Building alongside you
        </p>
        {day45 ? (
          <p className="text-xs text-[var(--t2)]">
            Community browse placeholder - full directory post-MVP.
          </p>
        ) : (
          <p className="text-xs text-[var(--t2)]">
            <span className="inline-flex items-center gap-1 rounded border border-[var(--bdr)] px-2 py-0.5 text-[10px] uppercase mr-2">
              Day 45
            </span>
            Unlocks when you hit 45 days executed.
          </p>
        )}
      </div>
    </div>
  );
}
