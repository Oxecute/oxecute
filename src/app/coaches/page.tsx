"use client";

import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";

export default function CoachesPage() {
  return (
    <AuthenticatedShell>
      <main className="max-w-xl mx-auto px-6 py-12 space-y-8 text-center">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1 text-xs font-bold text-indigo-400 tracking-wide uppercase">
            🔒 Coaches coming soon
          </span>
          <h1 
            className="text-3xl font-extrabold text-white tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
          >
            Direct Coach Access
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Domain experts who can see your verified execution record before they say yes. No warm intros required. Your record speaks first.
          </p>
        </div>

        <div className="max-w-md mx-auto pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
            You will automatically receive an inbox message when direct coach access becomes available for your record.
          </p>
        </div>
      </main>
    </AuthenticatedShell>
  );
}
