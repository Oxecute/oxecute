"use client";

import { AuthenticatedShell, useShellUser } from "@/components/app/AuthenticatedShell";
import { useCallback, useEffect, useState } from "react";

type RequestRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  upvote_count: number;
  submitter_label: string;
  upvoted: boolean;
  created_at: string;
};

function BoardMain() {
  const user = useShellUser();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [tab, setTab] = useState<"all" | string>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/board/requests");
    const j = await res.json();
    setRequests(j.requests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const day7 = Boolean(user.day7_reached);
  const day21 = Boolean(user.day21_reached);

  const statuses = Array.from(new Set(requests.map((r) => r.status)));
  const filtered =
    tab === "all" ? requests : requests.filter((r) => r.status === tab);

  const sorted = [...filtered].sort((a, b) => b.upvote_count - a.upvote_count);

  return (
    <div className="space-y-6 max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Feature Request Board</h1>
            <p className="text-sm text-[var(--t2)] mt-1">
              Upvote with your record after Day 7. Requests open once you&apos;ve crossed Day 21.
            </p>
          </div>
          {day21 ? (
            <button
              type="button"
              className="rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold px-5 py-2 text-sm"
              title="Submit flow ships next - flag yourself on Discord for now."
            >
              + Request
            </button>
          ) : (
            <span
              className="text-xs text-[var(--t3)] border border-[var(--bdr)] rounded-full px-3 py-1"
              title="Unlocks at Day 21 executed"
            >
              + Request · Day 21
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            className={`rounded-full px-3 py-1 border ${tab === "all" ? "border-[var(--p)] text-[var(--p)]" : "border-[var(--bdr)] text-[var(--t2)]"}`}
            onClick={() => setTab("all")}
          >
            All
          </button>
          {statuses.map((s) => (
            <button
              type="button"
              key={s}
              className={`rounded-full px-3 py-1 border capitalize ${tab === s ? "border-[var(--p)] text-[var(--p)]" : "border-[var(--bdr)] text-[var(--t2)]"}`}
              onClick={() => setTab(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? <p className="text-[var(--t2)]">Loading…</p> : null}

        <ul className="space-y-4">
          {sorted.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <h2 className="font-semibold text-[var(--t1)]">{r.title}</h2>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--t3)] border border-[var(--bdr)] rounded-full px-2 py-0.5">
                    {r.status}
                  </span>
                  <span className="text-[10px] text-[var(--t3)]">{r.category}</span>
                </div>
                <p className="text-sm text-[var(--t2)]">{r.description}</p>
                <p className="text-xs text-[var(--t3)]">By {r.submitter_label}</p>
              </div>
              <div className="flex sm:flex-col items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={!day7 || r.upvoted}
                  title={!day7 ? "Upvotes unlock after 7 days executed." : r.upvoted ? "You already upvoted" : "Upvote"}
                  className={`min-w-[72px] rounded-xl border px-3 py-2 text-sm font-semibold ${
                    r.upvoted
                      ? "border-[var(--p)] text-[var(--p)] bg-[var(--sur2)]"
                      : day7
                        ? "border-[var(--bdr)] text-[var(--t1)] hover:border-[var(--p)]"
                        : "opacity-40 cursor-not-allowed border-[var(--bdr)]"
                  }`}
                  onClick={async () => {
                    if (!day7 || r.upvoted) return;
                    const res = await fetch("/api/board/upvote", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ request_id: r.id }),
                    });
                    if (res.ok) void load();
                  }}
                >
                  ▲ {r.upvote_count}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
  );
}

export default function BoardPage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / Request Feature">
      <BoardMain />
    </AuthenticatedShell>
  );
}
