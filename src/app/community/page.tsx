"use client";

import { AuthenticatedShell, useShellUser } from "@/components/app/AuthenticatedShell";
import { FaLock } from "react-icons/fa";

const MOCK_FOUNDERS = [
  {
    name: "Medini M.",
    username: "medini",
    startup: "Oxecute",
    description: "Verified record tool for high-velocity founders.",
    stage: "Pre-seed",
    daysExecuted: 46,
  },
  {
    name: "Alex K.",
    username: "alexk",
    startup: "Saasify",
    description: "Micro-SaaS generation using agentic workflows.",
    stage: "Idea stage",
    daysExecuted: 45,
  },
  {
    name: "Sarah L.",
    username: "sarahl",
    startup: "HealthAI",
    description: "Automating clinical trial data ingestion.",
    stage: "Seed",
    daysExecuted: 50,
  },
];

function CommunityContent() {
  const user = useShellUser();
  const day45Reached = Boolean(user.day45_reached);
  const execCount = Number(user.execution_count ?? 0);

  if (!day45Reached) {
    const toGo = Math.max(1, 45 - execCount);
    const progressPercent = Math.min(100, Math.round((execCount / 45) * 100));

    return (
      <main className="max-w-xl mx-auto px-6 py-12 space-y-8 text-center">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 px-3.5 py-1 text-xs font-bold text-violet-400 tracking-wide uppercase">
            <FaLock className="w-3 h-3 text-violet-400" /> Community unlocks at Day 45
          </span>
          <h1 
            className="text-3xl font-extrabold text-white tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
          >
            Peer Directory & Connect
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Browse founders at your exact stage who have executed 45+ days. Connect one-to-one — consent-based, no public feed, no likes. Mutual accept required — you control who reaches you. No broadcasting. All interaction is private.
          </p>
        </div>

        {/* Progress track */}
        <div className="bg-[#14161f] border border-white/[0.08] rounded-xl p-5 text-left space-y-3 max-w-md mx-auto">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-semibold uppercase tracking-wider">Your Record Progress</span>
            <span className="text-violet-400 font-mono font-semibold">{execCount} / 45 Days</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500 text-center pt-1 font-medium">
            You are on <span className="text-zinc-300 font-bold">{execCount} days</span> executed. <span className="text-[#DEF408] font-bold">{toGo} days</span> to qualify.
          </p>
        </div>

        <div className="max-w-md mx-auto pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
            You will automatically receive an inbox message and unlock this tab the moment you hit your Day 45 milestone.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Banner */}
      <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/20 px-4 py-4 flex gap-3 items-start">
        <span className="text-emerald-400 mt-0.5" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-emerald-300">Qualified at Day 45!</p>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Full peer directory browse and connect flows are coming in Month 3. You qualified at Day 45!
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h1 
          className="text-2xl font-extrabold text-white tracking-tight"
          style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
        >
          Peer Directory
        </h1>
        <p className="text-xs text-zinc-400">
          Showing founders who have unlocked Community access at 45+ execution days.
        </p>
      </div>

      {/* Directory cards */}
      <div className="grid md:grid-cols-2 gap-4 pt-2">
        {MOCK_FOUNDERS.map((founder, i) => (
          <div 
            key={i} 
            className="rounded-xl border border-white/[0.08] bg-[#14161f] p-5 space-y-3 hover:border-white/[0.15] transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">{founder.name}</h3>
                  <p className="text-[11px] text-zinc-500">@{founder.username}</p>
                </div>
                <span className="text-[10px] font-bold text-[#DEF408] bg-[#DEF408]/10 border border-[#DEF408]/20 px-2 py-0.5 rounded-full uppercase">
                  {founder.stage}
                </span>
              </div>
              <p className="text-[13px] text-zinc-300 leading-snug font-medium">
                Building <span className="text-white font-bold">{founder.startup}</span>
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {founder.description}
              </p>
            </div>
            <div className="border-t border-white/[0.05] pt-3 flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium">Execution record:</span>
              <span className="text-emerald-400 font-mono font-bold">{founder.daysExecuted} days executed</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function CommunityPage() {
  return (
    <AuthenticatedShell>
      <CommunityContent />
    </AuthenticatedShell>
  );
}
