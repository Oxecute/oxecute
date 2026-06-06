"use client";

import { useEffect, useState } from "react";

import type { MeUser } from "./DashboardNav";
import { formatCountdown, getUtcWindowRemainingParts } from "./utc-countdown";

const card =
  "rounded-xl border p-4 transition-colors [&_strong]:font-semibold";
const cardSurface = `${card} border-[var(--bdr)] bg-[var(--sur)]`;
const cardMuted = `${card} border-[var(--bdr)] bg-[var(--sur2)]`;
const cardFlyout = `${card} border-white/[0.12] bg-[#141a22]`;
const cardFlyoutMuted = `${card} border-white/[0.08] bg-[#10151c]`;

export function RightRail({
  user,
  tone = "surface",
}: {
  user: MeUser & { created_at?: string };
  tone?: "surface" | "flyout";
}) {
  const flyout = tone === "flyout";
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
    { n: 1, label: "Day 1", done: exec >= 1 || day21 || day45 },
    { n: 21, label: "Day 21", done: exec >= 21 || day21 || day45 },
    { n: 45, label: "Day 45", done: exec >= 45 || day45 },
    { n: 60, label: "Day 60", done: exec >= 60 },
    { n: 90, label: "Day 90", done: exec >= 90 },
  ];
  const currentIdx =
    exec >= 90 ? 4 :
    exec >= 60 ? 3 :
    (exec >= 45 || day45) ? 2 :
    (exec >= 21 || day21) ? 1 :
    exec >= 1 ? 0 : 0;

  const labelMuted = flyout ? "text-zinc-400" : "text-[var(--t3)]";
  const textBody = flyout ? "text-zinc-300" : "text-[var(--t2)]";
  const textTitle = flyout ? "text-zinc-50" : "text-[var(--t1)]";

  const mkCard = (muted: boolean) =>
    flyout ? (muted ? cardFlyoutMuted : cardFlyout) : muted ? cardMuted : cardSurface;

  const ringCurrent = flyout
    ? "border-[#d9f50a] bg-[#d9f50a] text-zinc-950"
    : "border-[var(--ac)] text-[var(--fw)] bg-[var(--mi)]";
  const ringDone = flyout
    ? "border-[#d9f50a]/90 bg-[#d9f50a]/90 text-zinc-950"
    : "border-[var(--ac)] bg-[var(--ac)] text-[var(--mi)]";
  const ringUpcoming = flyout
    ? "border-white/10 text-zinc-400 bg-[#0c0f14]"
    : "border-[var(--bdr)] text-[var(--t3)] bg-[var(--sur)]";

  const unlockBox = flyout
    ? "mt-3 rounded-lg bg-emerald-500/10 border border-emerald-400/35 p-3 text-xs text-zinc-300"
    : "mt-3 rounded-lg bg-[rgba(34,197,94,0.12)] border border-[var(--green)]/30 p-3 text-xs text-[var(--t2)]";

  return (
    <div className={`space-y-6 text-sm ${flyout ? "text-zinc-200" : ""}`}>
      <div className={mkCard(false)}>
        <p className={`text-xs font-semibold ${labelMuted} uppercase tracking-wide mb-2`}>
          Window closes UTC
        </p>
        <p className={`text-2xl font-bold tabular-nums ${textTitle}`}>{countdown}</p>
        <p className={`text-xs ${labelMuted} mt-1`}>Until 23:59:59 UTC today</p>
      </div>

      <div className={mkCard(true)}>
        {day21 ? (
          <p className={`text-sm ${textBody}`}>
            Conexa: Daily Directive and deeper execution flows are live from your nav. Keep
            closing the window before UTC midnight.
          </p>
        ) : (
          <p className={`text-sm ${textBody}`}>
            Daily directive flow unlocks at 21 days executed. Your execution window closes at 23:59:59
            UTC.
          </p>
        )}
      </div>

      <div>
        <p className={`text-[10px] font-semibold ${labelMuted} uppercase tracking-widest mb-3`}>
          Journey milestone
        </p>
        <div className="flex justify-between items-start gap-1">
          {milestones.map((m, i) => (
            <div key={m.n} className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i <= currentIdx && m.done
                    ? ringDone
                    : i === currentIdx
                      ? ringCurrent
                      : ringUpcoming
                }`}
              >
                {String(m.n)}
              </div>
              <span className={`text-[10px] ${labelMuted} mt-1 text-center leading-tight`}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
        {!day21 ? (
          <div className={unlockBox}>
            Day 21: Signal Score, Daily Directive, and 5 more Conexa tabs unlock.
          </div>
        ) : null}
      </div>

      <div className={mkCard(false)}>
        <p className={`text-[10px] font-semibold ${labelMuted} uppercase tracking-widest mb-2`}>
          Building alongside you
        </p>
        {day45 ? (
          <p className={`text-xs ${textBody}`}>
            Community browse placeholder - full directory post-MVP.
          </p>
        ) : (
          <p className={`text-xs ${textBody}`}>
            <span
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] uppercase mr-2 ${
                flyout ? "border-white/15" : "border-[var(--bdr)]"
              }`}
            >
              Day 45
            </span>
            Unlocks at 45 days executed.
          </p>
        )}
      </div>
    </div>
  );
}
