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
    dot: "bg-ox-t2",
    box: "border-[rgba(255,255,255,0.12)] text-[#EAEFF8] bg-[rgba(255,255,255,0.06)]",
  };
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
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sortOpt, setSortOpt] = useState<"top" | "new" | "active">("top");
  const [loading, setLoading] = useState(true);

  // Submit Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<"integration" | "feature" | "ui" | "bug" | "other">("feature");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
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

  // Hardcoded standard statuses as tabs
  const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "reviewing", label: "Reviewing" },
    { key: "planned", label: "Planned" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "closed", label: "Closed" },
  ];

  // Hardcoded standard categories
  const CAT_FILTERS = [
    { key: "all", label: "All Categories" },
    { key: "integration", label: "Integration" },
    { key: "feature", label: "Feature" },
    { key: "ui", label: "UI" },
    { key: "bug", label: "Bug" },
    { key: "other", label: "Other" },
  ];

  const handleSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim().length < 5 || newTitle.trim().length > 100) {
      setSubmitError("Title must be between 5 and 100 characters.");
      return;
    }
    if (newDesc.trim().length < 20 || newDesc.trim().length > 1000) {
      setSubmitError("Description must be between 20 and 1000 characters.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/board/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          category: newCat,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(j.error || "Could not submit your request.");
        return;
      }
      setModalOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewCat("feature");
      await load();
    } catch {
      setSubmitError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requests.filter((r) => {
    const statusMatch = tab === "all" || normStatus(r.status) === normStatus(tab);
    const catMatch = catFilter === "all" || r.category.toLowerCase() === catFilter.toLowerCase();
    return statusMatch && catMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortOpt === "new") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortOpt === "active") {
      const aScore = a.upvote_count + (a.comment_count ?? 0) * 2;
      const bScore = b.upvote_count + (b.comment_count ?? 0) * 2;
      return bScore - aScore;
    }
    // Default: 'top' sort (by upvotes)
    return b.upvote_count - a.upvote_count;
  });

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-8 px-5 pb-10 pt-5 sm:px-7 sm:pt-7 md:pb-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#EAEFF8]" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
            Feature Request Board
          </h1>
          <p className="text-[12px] sm:text-[13px] text-ox-t2 leading-relaxed mt-1 max-w-xl">
            Shape the product with your record. Upvotes unlock after Day 7; new requests open at Day 21.
          </p>
        </div>
        {day21 && (
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setSubmitError(null);
                setModalOpen(true);
              }}
              className="rounded-full bg-[#0EA472] text-white font-semibold px-4 py-2 text-[12px] shadow-[0_4px_12px_rgba(14,164,114,0.22)] hover:opacity-95 transition-opacity"
            >
              + New request
            </button>
          </div>
        )}
      </div>

      {/* Tabs Filter (Status) */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.14em] px-1">Status</p>
        <div className="flex flex-wrap gap-1.5 text-sm">
          {STATUS_TABS.map((t) => (
            <button
              type="button"
              key={t.key}
              className={`${FILTER_BASE} ${
                tab === t.key
                  ? "border-[#0EA472] bg-[#0EA472] text-white font-semibold shadow-[0_4px_14px_rgba(14,164,114,0.3)]"
                  : FILTER_IDLE
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories & Sort */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.14em] px-1">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {CAT_FILTERS.map((c) => (
              <button
                type="button"
                key={c.key}
                className={`rounded-lg px-3 py-1.5 border text-xs transition-colors ${
                  catFilter === c.key
                    ? "border-[rgba(124,100,220,0.55)] text-[#ddd6fe] bg-[rgba(124,100,220,0.16)]"
                    : FILTER_IDLE
                }`}
                onClick={() => setCatFilter(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 shrink-0">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.14em] px-1 sm:text-right">Sort</p>
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5 overflow-hidden">
            {(
              [
                ["top", "Top"],
                ["new", "New"],
                ["active", "Active"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortOpt(key)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  sortOpt === key
                    ? "bg-[#4F46E5] text-white"
                    : "text-ox-t2 hover:text-[#EAEFF8]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-[var(--t2)] text-sm py-8 text-center">Loading requests…</p>
      ) : sorted.length === 0 ? (
        <p className="text-[var(--t2)] text-sm py-12 text-center border border-[var(--bdr)] rounded-2xl bg-[var(--sur)]">
          No feature requests match your filter.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--bdr)] border border-[var(--bdr)] rounded-2xl bg-[var(--sur)] overflow-hidden shadow-lg">
          {sorted.map((r) => {
            const st = statusStyle(r.status);
            const comments = Number(r.comment_count ?? 0);
            const isTeam = !r.submitter_label.includes("@") && r.submitter_label.toLowerCase().includes("team");
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
              <li key={r.id} className="p-4 sm:p-5 hover:bg-[var(--sur2)]/60 transition-colors">
                <div className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-full shrink-0 bg-[var(--p)] text-[var(--fw)] text-xs font-bold flex items-center justify-center border border-white/[0.08]"
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
                              ? "Upvote unlocks at 7 days executed."
                              : r.upvoted
                                ? "You already upvoted"
                                : "Upvote"
                          }
                          className={`inline-flex items-center gap-1 font-semibold ${
                            r.upvoted ? "text-[#0EA472]" : "text-[var(--t2)] hover:text-[#0EA472]"
                          } disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
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
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-0.5 shrink-0">
                            <path d="M12 4l-9 12h18L12 4z" strokeLinejoin="round" fill={r.upvoted ? "currentColor" : "none"} />
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
      )}

      {/* Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-[100] backdrop-blur-[2px]">
          <div className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.11] bg-[#0d0f1a] shadow-[0_24px_60px_rgba(0,0,0,0.45)] text-[#EAEFF8]">
            <div className="px-6 md:px-8 pt-7 pb-5 border-b border-white/[0.06] space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#0EA472]">
                New feature request
              </p>
              <h2 className="text-[22px] sm:text-[26px] font-extrabold text-[#EAEFF8] tracking-[-0.02em]" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                Propose a new feature
              </h2>
            </div>
            <form onSubmit={handleSub} className="px-6 md:px-8 py-6 space-y-5">
              <div>
                <label className="block text-[11px] font-medium text-ox-t2 mb-1.5">
                  Title
                </label>
                <input
                  className="w-full rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] placeholder:text-[var(--ox-placeholder)]"
                  placeholder="e.g. Backfill Execution Record"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setSubmitError(null);
                  }}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ox-t2 mb-1.5">
                  Category
                </label>
                <select
                  className="w-full rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A]"
                  value={newCat}
                  onChange={(e) => {
                    setNewCat(e.target.value as "integration" | "feature" | "ui" | "bug" | "other");
                    setSubmitError(null);
                  }}
                >
                  <option value="feature" className="bg-[#1C1F2A]">Feature</option>
                  <option value="integration" className="bg-[#1C1F2A]">Integration</option>
                  <option value="ui" className="bg-[#1C1F2A]">UI</option>
                  <option value="bug" className="bg-[#1C1F2A]">Bug</option>
                  <option value="other" className="bg-[#1C1F2A]">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ox-t2 mb-1.5">
                  Description
                </label>
                <textarea
                  className="w-full min-h-[120px] rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] placeholder:text-[var(--ox-placeholder)]"
                  placeholder="Describe the feature, why it is needed, and how it helps early-stage founders."
                  value={newDesc}
                  onChange={(e) => {
                    setNewDesc(e.target.value);
                    setSubmitError(null);
                  }}
                  maxLength={1000}
                  required
                />
                <p className="text-[10px] text-zinc-500 mt-1 text-right">{newDesc.length}/1000</p>
              </div>

              {submitError && (
                <p className="text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2.5">
                  {submitError}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-white bg-[#0EA472] shadow-[0_4px_16px_rgba(14,164,114,0.25)] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? "Submitting…" : "Submit Request"}
                </button>
                <button
                  type="button"
                  className="text-sm text-ox-t2 hover:text-[#EAEFF8] py-2 text-center"
                  onClick={() => {
                    setModalOpen(false);
                    setNewTitle("");
                    setNewDesc("");
                    setNewCat("feature");
                    setSubmitError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BoardPage() {
  return (
    <AuthenticatedShell>
      <BoardMain />
    </AuthenticatedShell>
  );
}
