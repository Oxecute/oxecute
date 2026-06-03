"use client";

import { AuthenticatedShell, useShellUser } from "@/components/app/AuthenticatedShell";
import { useState } from "react";

function AngelsContent() {
  const user = useShellUser();
  
  // Data extraction
  const recordAge = Number(user.days_on_record ?? 0);
  const execCount = Number(user.execution_count ?? 0);
  const breakCount = Number(user.break_count ?? 0);
  const userTier = user.tier || "record";

  // Calculations
  const totalDays = execCount + breakCount;
  const executionRate = totalDays > 0 ? Math.round((execCount / totalDays) * 100) : 0;
  
  const hasDay21 = execCount >= 21;
  const signalScore = hasDay21 ? Math.round((execCount / Math.max(1, totalDays)) * 100) : 0;

  // 4 Conditions
  const cond1 = recordAge >= 60;
  const cond2 = executionRate >= 70;
  const cond3 = hasDay21 && signalScore >= 45;
  const cond4 = userTier === "builder";

  const isQualified = cond1 && cond2 && cond3 && cond4;

  // Local interactive states
  const [optIn, setOptIn] = useState(false);

  return (
    <main className="max-w-xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-400 tracking-wide uppercase">
          {isQualified ? "✓ Ready to Unlock" : "🔒 Investor Visibility"}
        </span>
        <h1 
          className="text-3xl font-extrabold text-white tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
        >
          Investor Visibility Dashboard
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
          Investor discovery for founders whose record qualifies. Not a pitch. A verified track record, opt-in, and fully founder-controlled. Privacy is the default.
        </p>
      </div>

      {/* Checklist */}
      <div className="bg-[#14161f] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest border-b border-white/[0.06] pb-3 mb-2">
          Qualification Checklist
        </h3>

        <div className="space-y-4">
          {/* Condition 1: Age */}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0" aria-hidden>
              {cond1 ? (
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-zinc-600 bg-black/20" />
              )}
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-white">Record Age: Day 60</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Current record age: <span className="text-zinc-300 font-bold">{recordAge} / 60 days</span>.
              </p>
            </div>
          </div>

          {/* Condition 2: Rate */}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0" aria-hidden>
              {cond2 ? (
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-zinc-600 bg-black/20" />
              )}
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-white">Execution Rate: 70%+</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Current execution rate: <span className="text-zinc-300 font-bold">{executionRate}%</span>.
              </p>
            </div>
          </div>

          {/* Condition 3: Score */}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0" aria-hidden>
              {cond3 ? (
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-zinc-600 bg-black/20" />
              )}
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-white">Signal Score: 45+</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {!hasDay21 
                  ? "Unlocks at 21 days executed." 
                  : `Current Signal Score: ${signalScore} (requires 45+).`}
              </p>
            </div>
          </div>

          {/* Condition 4: Tier */}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0" aria-hidden>
              {cond4 ? (
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-zinc-600 bg-black/20" />
              )}
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-white">Pathfinder (Builder/Operator) Tier</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Current tier: <span className="text-zinc-300 font-bold uppercase">{userTier}</span>. Upgrade from dashboard to qualify.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional UI */}
      {isQualified ? (
        <div className="bg-[#0e1610] border border-emerald-500/20 rounded-2xl p-6 text-center space-y-4">
          <p className="text-sm font-semibold text-emerald-400">✓ You are qualified for Investor Visibility!</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Visibility Status:</span>
            <button
              type="button"
              onClick={() => setOptIn(!optIn)}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all border ${
                optIn 
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" 
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
              }`}
            >
              {optIn ? "Active (Visible)" : "Inactive (Hidden)"}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            {optIn 
              ? "Your record is visible to matching investors. Toggling this will instantly hide it again." 
              : "Slide to Active to let qualified matching angels search and see your execution record."}
          </p>
        </div>
      ) : (
        <div className="space-y-6 text-center pt-2">
          <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
            You do not currently meet all 4 conditions. Once qualified, you will be able to opt-in to matchmaking and control your visibility settings.
          </p>

          <div className="max-w-md mx-auto pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              You will automatically receive an inbox message and unlock full visibility settings the moment your record meets all 4 qualification conditions.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AngelsPage() {
  return (
    <AuthenticatedShell>
      <AngelsContent />
    </AuthenticatedShell>
  );
}
