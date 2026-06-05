"use client";

import { AuthenticatedShell, useShellUser } from "@/components/app/AuthenticatedShell";

import { RECORD_PAGE_SUBTITLE_CLASS } from "@/components/app/RecordPageHeader";
import { useEffect, useState } from "react";

type SignalStats = {
  latest: {
    raw: number;
    smoothed: number;
  };
  components: {
    streak_depth: {
      score: number;
      execution_rate: number;
      breaks_30d: number;
      weight: number;
    };
    directive_completion: {
      score: number;
      completed: number;
      total: number;
      weight: number;
    };
    artifact_diversity: {
      score: number;
      categories: string[];
      weight: number;
    };
  };
  history: {
    score_date: string;
    raw_score: number;
    smoothed_score: number;
  }[];
};

function SignalContent() {
  const user = useShellUser();
  const day21 = Boolean(user.day21_reached);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SignalStats | null>(null);

  const loadSignalData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/signal");
      if (res.ok) {
        const j = await res.json();
        setData(j);
      }
    } catch (err) {
      console.error("Failed to load signal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (day21) {
      void loadSignalData();
    } else {
      setLoading(false);
    }
  }, [day21]);

  if (loading) {
    return (
      <section className="text-[#EAEFF8] p-5 sm:p-7 flex items-center justify-center min-h-[300px]">
        <span className="inline-block h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </section>
    );
  }

  if (day21) {
    if (!data) {
      return (
        <section className="text-[#EAEFF8] p-5 sm:p-7 space-y-6 max-w-4xl mx-auto">
          <p className="text-zinc-400">Failed to load execution analytics. Please check back later.</p>
        </section>
      );
    }

    const { latest, components, history } = data;

    // SVG coordinates calculator
    const width = 600;
    const height = 200;
    const paddingX = 40;
    const paddingY = 30;

    const getX = (index: number, total: number) => {
      if (total <= 1) return width / 2;
      return paddingX + (index / (total - 1)) * (width - 2 * paddingX);
    };

    const getY = (score: number) => {
      return height - paddingY - (score / 100) * (height - 2 * paddingY);
    };

    const rawPath = history.length > 1
      ? "M " + history.map((h, i) => `${getX(i, history.length)},${getY(h.raw_score)}`).join(" L ")
      : "";

    const smoothedPath = history.length > 1
      ? "M " + history.map((h, i) => `${getX(i, history.length)},${getY(h.smoothed_score)}`).join(" L ")
      : "";

    return (
      <section className="text-[#EAEFF8] p-5 sm:p-7 space-y-8 max-w-4xl mx-auto pb-24">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
            Signal Score
          </h1>
          <p className={RECORD_PAGE_SUBTITLE_CLASS}>
            Your execution, quantified. Conexa tracks consistency, directive adherence, and artifact diversity to index your founder score.
          </p>
        </div>

        {/* Big Score Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Smoothed Score Display */}
          <div className="rounded-2xl border border-[rgba(124,100,220,0.35)] bg-[rgba(124,100,220,0.06)] p-6 flex flex-col justify-between space-y-4 shadow-[0_0_24px_rgba(124,100,220,0.1)]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">7-Day Smoothed Signal</span>
              <p className="text-xs text-zinc-400">Damps daily spikes to reveal real trajectory.</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-white leading-none">
                {latest.smoothed}
              </span>
              <span className="text-zinc-500 font-medium">/ 100</span>
            </div>
          </div>

          {/* Raw Score Display */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#14161f] p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Raw Daily Score</span>
              <p className="text-xs text-zinc-400">Real-time score matching today&apos;s state.</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-zinc-100 leading-none">
                {latest.raw}
              </span>
              <span className="text-zinc-500 font-medium">/ 100</span>
            </div>
          </div>

          {/* Badge Display */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#14161f] p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#DEF408]">Conexa Classification</span>
              <p className="text-xs text-zinc-400">Your operator index based on signal tier.</p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded bg-[#DEF408]/10 border border-[#DEF408]/20 px-3 py-1 text-xs font-bold text-[#DEF408] uppercase tracking-wide">
                {latest.smoothed >= 85
                  ? "VERIFIED OPERATOR"
                  : latest.smoothed >= 60
                  ? "PATHFINDER"
                  : "CALIBRATING"}
              </span>
            </div>
          </div>
        </div>

        {/* History Graph */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#14161f] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Historical Performance</span>
            <div className="flex gap-4 text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1 text-indigo-400">
                <span className="w-2.5 h-0.5 bg-indigo-500 rounded" /> Smoothed
              </span>
              <span className="flex items-center gap-1 text-[#6b7280]">
                <span className="w-2.5 h-0.5 bg-[#4b5563] rounded" /> Raw
              </span>
            </div>
          </div>

          {history.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[550px] relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((level) => (
                    <g key={level} className="opacity-20">
                      <line
                        x1={paddingX}
                        y1={getY(level)}
                        x2={width - paddingX}
                        y2={getY(level)}
                        stroke="#71717a"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 10}
                        y={getY(level) + 4}
                        fill="#a1a1aa"
                        fontSize="9"
                        textAnchor="end"
                        className="font-mono"
                      >
                        {level}
                      </text>
                    </g>
                  ))}

                  {/* Raw Path */}
                  {rawPath && (
                    <path
                      d={rawPath}
                      fill="none"
                      stroke="#4b5563"
                      strokeWidth="1.5"
                      strokeOpacity="0.6"
                    />
                  )}

                  {/* Smoothed Path */}
                  {smoothedPath && (
                    <path
                      d={smoothedPath}
                      fill="none"
                      stroke="rgba(124,100,220,1)"
                      strokeWidth="2.5"
                    />
                  )}

                  {/* Nodes */}
                  {history.map((h, i) => (
                    <g key={i} className="group cursor-pointer">
                      {/* Interaction Area */}
                      <circle
                        cx={getX(i, history.length)}
                        cy={getY(h.smoothed_score)}
                        r="10"
                        fill="transparent"
                      />
                      {/* Score Node */}
                      <circle
                        cx={getX(i, history.length)}
                        cy={getY(h.smoothed_score)}
                        r="4.5"
                        fill="rgba(124,100,220,1)"
                        stroke="#14161f"
                        strokeWidth="1.5"
                      />
                      {/* Tooltip mockup / dynamic display helper */}
                      <title>{`Date: ${h.score_date}\nSmoothed: ${h.smoothed_score}\nRaw: ${h.raw_score}`}</title>
                    </g>
                  ))}
                </svg>

                {/* X Axis Dates */}
                <div className="flex justify-between px-[40px] pt-1 text-[9px] font-mono text-zinc-500">
                  {history.map((h, i) => {
                    // Only show first, middle, last to avoid crowding
                    if (i === 0 || i === history.length - 1 || (history.length > 5 && i === Math.floor(history.length / 2))) {
                      const d = new Date(h.score_date);
                      return <span key={i}>{d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>;
                    }
                    return <span key={i} className="opacity-0">-</span>;
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-center text-xs text-zinc-500 border border-white/5 rounded-xl bg-white/[0.01]">
              Historical tracking will populate as daily evaluations compile.
            </div>
          )}
        </div>

        {/* Raw Components breakdown */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Components breakdown</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Component 1: Streak Depth */}
            <div className="rounded-xl border border-white/[0.08] bg-[#14161f] p-5 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Streak Depth</span>
                <span className="text-xl font-extrabold text-white">{components.streak_depth.score}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Measures execution rate over time, penalizing gaps/breaks written in the last 30 days.
              </p>
              <div className="space-y-2 pt-2 border-t border-white/5 text-[11px] font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span>Execution Rate:</span>
                  <span className="text-white">{components.streak_depth.execution_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>30d Break Marks:</span>
                  <span className="text-red-400">{components.streak_depth.breaks_30d} (-{components.streak_depth.breaks_30d * 4} pts)</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-white/[0.03]">
                  <span>Component weight:</span>
                  <span className="text-[#DEF408]">{components.streak_depth.weight}%</span>
                </div>
              </div>
            </div>

            {/* Component 2: Directive Completion */}
            <div className="rounded-xl border border-white/[0.08] bg-[#14161f] p-5 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Directive Completion</span>
                <span className="text-xl font-extrabold text-white">{components.directive_completion.score}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Measures adherence to Conexa behavioral targets and avoiding tags directives.
              </p>
              <div className="space-y-2 pt-2 border-t border-white/5 text-[11px] font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="text-white">{components.directive_completion.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Issued:</span>
                  <span className="text-white">{components.directive_completion.total}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-white/[0.03]">
                  <span>Component weight:</span>
                  <span className="text-[#DEF408]">{components.directive_completion.weight}%</span>
                </div>
              </div>
            </div>

            {/* Component 3: Artifact Diversity */}
            <div className="rounded-xl border border-white/[0.08] bg-[#14161f] p-5 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#DEF408]">Artifact Diversity</span>
                <span className="text-xl font-extrabold text-white">{components.artifact_diversity.score}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Indexes diversity of shipped work across the Signal Triangle (Product, Ops, Distribution).
              </p>
              <div className="space-y-2 pt-2 border-t border-white/5 text-[11px] font-mono text-zinc-400">
                <div className="flex flex-wrap gap-1.5 py-1">
                  {["product", "distribution", "ops"].map((cat) => {
                    const active = components.artifact_diversity.categories.includes(cat);
                    return (
                      <span
                        key={cat}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          active
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-white/5 text-zinc-600 border border-white/5"
                        }`}
                      >
                        {cat}
                      </span>
                    );
                  })}
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-white/[0.03]">
                  <span>Component weight:</span>
                  <span className="text-[#DEF408]">{components.artifact_diversity.weight}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="text-[#EAEFF8] p-5 sm:p-7 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
          Signal Score
        </h1>
        <p className={RECORD_PAGE_SUBTITLE_CLASS}>
          Your execution, quantified. Activates after 21 days of execution. Keep going — it&apos;s already watching.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14161f]">
        <div className="relative h-[min(58vh,520px)] w-full overflow-hidden">
          <img
            src="/brand/daily-directive-lock-preview.png"
            alt=""
            className="absolute left-1/2 top-1/2 min-h-[115%] min-w-[115%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-top blur-lg scale-100"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[#0a0c12]/45" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center px-6 py-12">
            <p className="text-center text-[15px] sm:text-base font-normal text-[#EAEFF8] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Unlocks at 21 days executed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SignalPage() {
  return (
    <AuthenticatedShell>
      <SignalContent />
    </AuthenticatedShell>
  );
}

