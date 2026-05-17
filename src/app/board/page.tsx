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
  comment_count?: number;
  submitter_label: string;
  upvoted: boolean;
  created_at: string;
};

function formatVotes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return String(n);
}

function normStatus(status: string): string {
  return status.toLowerCase().replace(/\s+/g, "_");
}

function statusStyle(status: string): { label: string; dot: string; box: string } {
  const s = normStatus(status);
  if (s.includes("progress"))
    return {
      label: status.replace(/_/g, " "),
      dot: "bg-[#0EA472]",
      box: "border-[rgba(14,164,114,0.5)] text-[#6ee7b7] bg-[rgba(14,164,114,0.12)]",
    };
  if (s.includes("review"))
    return {
      label: status.replace(/_/g, " "),
      dot: "bg-[#fb923c]",
      box: "border-[rgba(251,146,60,0.55)] text-[#fed7aa] bg-[rgba(251,146,60,0.14)]",
    };
  if (s.includes("pending") || s.includes("planned"))
    return {
      label: status.replace(/_/g, " "),
      dot: "bg-[#7C64DC]",
      box: "border-[rgba(124,100,220,0.55)] text-[#ddd6fe] bg-[rgba(124,100,220,0.16)]",
    };
  return {
    label: status.replace(/_/g, " "),
    dot: "bg-[#5E6580]",
    box: "border-[rgba(255,255,255,0.12)] text-[#EAEFF8] bg-[rgba(255,255,255,0.06)]",
  };
}

/** Active tab styles for status filters (dark UI only; distinct from "All"). */
function statusFilterSelectedClass(status: string): string {
  const s = normStatus(status);
  if (s.includes("review"))
    return "border-[#fb923c] text-[#ffedd5] bg-[rgba(251,146,60,0.22)] shadow-[inset_0_0_0_1px_rgba(251,146,60,0.35)]";
  if (s.includes("planned") || s.includes("pending"))
    return "border-[#7C64DC] text-[#ede9fe] bg-[rgba(124,100,220,0.28)] shadow-[inset_0_0_0_1px_rgba(124,100,220,0.4)]";
  if (s.includes("progress"))
    return "border-[#0EA472] text-[#ccfbf1] bg-[rgba(14,164,114,0.22)] shadow-[inset_0_0_0_1px_rgba(14,164,114,0.35)]";
  return "border-[#4F46E5] text-white bg-[#4F46E5] shadow-[0_4px_14px_rgba(79,70,229,0.35)]";
}

const FILTER_BASE =
  "rounded-full px-3 py-1.5 border text-xs font-medium capitalize transition-colors";
const FILTER_IDLE =
  "border-[rgba(255,255,255,0.12)] text-[#EAEFF8] bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.08)]";

function initialsFromLabel(label: string): string {
  const parts = label.replace(/^Day\s+\d+\s+·\s+@/, "").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  const w = label.replace(/@/g, "").trim();
  return w.slice(0, 2).toUpperCase() || "?";
}

function teamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

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
    <div className="space-y-8 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feature requests</h1>
          <p className="text-sm text-[var(--t2)] mt-1.5 leading-relaxed max-w-xl">
            Shape the product with your record. Upvotes unlock after Day 7; new requests open at Day 21.
          </p>
        </div>
        {day21 ? (
          <button
            type="button"
            className="rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold px-5 py-2 text-sm shadow-sm"
            title="Submit flow ships next - flag yourself on Discord for now."
          >
            + New request
          </button>
        ) : (
          <span
            className="text-xs text-[var(--t3)] border border-[var(--bdr)] rounded-full px-3 py-1.5 bg-[var(--sur2)]"
            title="Unlocks at Day 21 executed"
          >
            + New request · Day 21
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          className={`${FILTER_BASE} ${
            tab === "all"
              ? "border-[#0EA472] bg-[#0EA472] text-white font-semibold shadow-[0_4px_14px_rgba(14,164,114,0.3)]"
              : FILTER_IDLE
          }`}
          onClick={() => setTab("all")}
        >
          All
        </button>
        {statuses.map((s) => (
          <button
            type="button"
            key={s}
            className={`${FILTER_BASE} ${tab === s ? statusFilterSelectedClass(s) : FILTER_IDLE}`}
            onClick={() => setTab(s)}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? <p className="text-[var(--t2)] text-sm">Loading…</p> : null}

      <ul className="divide-y divide-[var(--bdr)] border border-[var(--bdr)] rounded-2xl bg-[var(--sur)] overflow-hidden">
        {sorted.map((r) => {
          const st = statusStyle(r.status);
          const comments = Number(r.comment_count ?? 0);
          const isTeam = !r.submitter_label.includes("@");
          const handle = r.submitter_label.match(/@([a-zA-Z0-9_-]+)/)?.[1];
          const displayName = isTeam
            ? r.submitter_label
            : handle
              ? `@${handle}`
              : r.submitter_label;
          const av = isTeam ? teamInitials(r.submitter_label) : initialsFromLabel(r.submitter_label);
          const shortDesc =
            r.description.length > 180 ? `${r.description.slice(0, 177)}…` : r.description;
          return (
            <li key={r.id} className="p-4 sm:p-5 hover:bg-[var(--sur2)]/80 transition-colors">
              <div className="flex gap-4">
                <div
                  className="w-10 h-10 rounded-full shrink-0 bg-[var(--p)] text-[var(--fw)] text-xs font-bold flex items-center justify-center"
                  aria-hidden
                >
                  {av}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs text-[var(--t2)]">
                    <span className="font-semibold text-[var(--t1)]">{displayName}</span>{" "}
                    <span className="text-[var(--t3)]">in {r.category}</span>
                  </p>
                  <h2 className="font-semibold text-[var(--t1)] text-base leading-snug">{r.title}</h2>
                  <p className="text-sm text-[var(--t2)] leading-relaxed">{shortDesc}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${st.box}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} aria-hidden />
                      {st.label}
                    </span>
                    <div className="flex items-center gap-4 text-xs text-[var(--t3)]">
                      <span className="inline-flex items-center gap-1" title="Comments">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        {comments}
                      </span>
                      <button
                        type="button"
                        disabled={!day7 || r.upvoted}
                        title={
                          !day7
                            ? "Upvotes unlock after 7 days executed."
                            : r.upvoted
                              ? "You already upvoted"
                              : "Upvote"
                        }
                        className={`inline-flex items-center gap-1 font-medium ${
                          r.upvoted ? "text-[var(--p)]" : "text-[var(--t2)] hover:text-[var(--p)]"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                        </svg>
                        {formatVotes(r.upvote_count)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
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
