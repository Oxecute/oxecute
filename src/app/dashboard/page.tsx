"use client";

import {
  AuthenticatedShell,
  useShellUser,
  useShellUserRefresh,
} from "@/components/app/AuthenticatedShell";
import { utcTodayISO } from "@/lib/dates";
import { submissionBrief } from "@/lib/entry-preview";
import {
  ENTRY_UPLOAD_ACCEPT,
  uploadEntryDeclarationFiles,
} from "@/lib/entry-uploads";
import { formatCountdown, getUtcWindowRemainingParts } from "@/components/app/utc-countdown";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

function Day21Gate({ onUnlock }: { onUnlock: () => void }) {
  return (
    <main className="min-h-screen bg-[var(--mi)] text-[var(--fw)] px-6 py-12 max-w-lg mx-auto flex flex-col gap-6">
      <p className="text-xs tracking-widest text-[var(--ac)]">21 DAYS EXECUTED · VERIFIED OPERATOR</p>
      <h1 className="text-[28px] font-extrabold leading-tight">
        21 days executed. Here&apos;s what you&apos;ve earned.
      </h1>
      <ol className="list-decimal list-inside space-y-2 text-[var(--ca)] text-sm">
        <li>Signal Score - your execution record, quantified</li>
        <li>Daily Directive - one action, one proof requirement, every day</li>
        <li>Conexa Intelligence - 5 more tabs reading 21 days of behaviour</li>
        <li>Day 21 Achievement Card - shareable, verified, yours</li>
        <li>Builder tier - the full execution toolkit</li>
      </ol>
      <div className="glass-card rounded-2xl p-4 mt-4">
        <p className="text-sm text-[var(--ca)] mb-2">Builder · $29/month</p>
        <p className="text-xs text-[var(--t3)]">India · ₹1,199/month</p>
      </div>
      <button
        type="button"
        className="w-full rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold py-3"
        onClick={async () => {
          await fetch("/api/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ day21_unlocked: true }),
          });
          onUnlock();
        }}
      >
        Unlock what you earned →
      </button>
      <button
        type="button"
        className="w-full rounded-full border border-white/20 py-3"
        onClick={async () => {
          await fetch("/api/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ day21_unlocked: true }),
          });
          onUnlock();
        }}
      >
        Continue on free tier
      </button>
    </main>
  );
}

const FORM_FIELD =
  "w-full rounded-lg border border-[var(--bdr)] bg-[var(--sur2)] px-3 py-2 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--p)]/25";

function DashboardMain() {
  const user = useShellUser();
  const refreshShellUser = useShellUserRefresh();
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatLog, setChatLog] = useState<{ role: string; content: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [decl, setDecl] = useState("");
  const [tab, setTab] = useState<"verified" | "declaration">("verified");
  const [cat, setCat] = useState<"product" | "distribution" | "ops">("product");
  const [dayDetail, setDayDetail] = useState<Record<string, unknown> | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [declFiles, setDeclFiles] = useState<File[]>([]);
  const [conexaTab, setConexaTab] = useState<string>("reality_check");
  const [countdownTick, setCountdownTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCountdownTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  void countdownTick;

  const windowCountdown = formatCountdown(getUtcWindowRemainingParts());

  const loadEntries = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const eRes = await fetch("/api/entries");
    const eJ = await eRes.json();
    setEntries(eJ.entries ?? []);
  }, [supabase.auth]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const report = user.conexa_day1_report as Record<string, unknown> | null;
  const tabs = (report?.tabs as Record<string, string>) ?? {};

  const CONEXA_TAB_ORDER: { key: string; label: string }[] = [
    { key: "reality_check", label: "Reality Check" },
    { key: "blindspot", label: "Blindspot" },
    { key: "shipping_vs_noise", label: "Shipping vs. Noise" },
    { key: "next_move", label: "Next Move" },
    { key: "integrity_forecast", label: "Integrity Forecast" },
    { key: "executive_synthesis", label: "Executive Synthesis" },
  ];

  const visibleConexaTabs = CONEXA_TAB_ORDER.filter((t) => Boolean(tabs[t.key]));
  const activeConexaKey =
    visibleConexaTabs.some((t) => t.key === conexaTab) && tabs[conexaTab]
      ? conexaTab
      : visibleConexaTabs[0]?.key ?? "reality_check";
  const today = utcTodayISO();
  const lastSub = user.last_submission_date as string | null | undefined;
  const gapWarn =
    lastSub && lastSub !== today
      ? `No submission logged for UTC today yet. Last lock: ${lastSub}.`
      : null;

  const recent = [...entries]
    .sort(
      (a, b) =>
        new Date(String(b.created_at ?? 0)).getTime() -
        new Date(String(a.created_at ?? 0)).getTime(),
    )
    .slice(0, 6);

  const byCat = { product: 0, distribution: 0, ops: 0 } as Record<string, number>;
  for (const e of entries) {
    const c = String(e.category ?? "");
    if (c in byCat) byCat[c]++;
  }
  const totalCat = byCat.product + byCat.distribution + byCat.ops || 1;

  const execCount = Number(user.execution_count ?? 0);
  const day21Reached = Boolean(user.day21_reached);
  const beganDate =
    user.created_at != null
      ? new Date(user.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : entries.length > 0
        ? new Date(
            Math.min(
              ...entries.map((e) => new Date(String(e.created_at ?? 0)).getTime()),
            ),
          ).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null;

  const gridLegend = (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--t3)] mt-3">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-[rgba(1,2,97,0.85)]" /> Verified Proof
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--purple)]" /> Declaration
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--orange)]" /> Upload
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--red)]" /> Break
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm border border-[var(--bdr)] bg-[var(--sur2)]" /> Future
      </span>
    </div>
  );

  return (
    <>
      <section className="space-y-8 pb-28 md:pb-24">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div>
            <h1 className="text-2xl font-bold text-[var(--t1)]">Founder Operating Record</h1>
            <p className="text-sm text-[var(--t2)] mt-1">
              Day {Math.max(1, execCount)} · Record Tier · Free
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-lg border border-[var(--bdr)] bg-[var(--sur2)] px-3 py-1.5 text-[var(--t2)] text-xs">
              Today
            </span>
            <a
              href={`/${user.username}`}
              className="text-[var(--p)] text-xs font-medium underline-offset-2 hover:underline whitespace-nowrap"
            >
              Public profile
            </a>
          </div>
        </div>

        {gapWarn ? (
          <p className="text-sm rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100 p-3">
            {gapWarn}
          </p>
        ) : null}

        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 min-w-0">
          <div className="rounded-lg sm:rounded-xl border border-[var(--bdr)] p-2.5 sm:p-3 bg-[var(--sur)] min-w-0">
            <p className="text-[9px] sm:text-[10px] text-[var(--t3)] uppercase tracking-wider leading-tight">
              Days executed
            </p>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
              <p className="text-xl sm:text-2xl font-bold tabular-nums leading-none">{String(execCount)}</p>
              <span className="text-[var(--green)] text-xs shrink-0" aria-hidden>
                ↗
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[var(--t2)] mt-1 leading-tight">
              {execCount} of 30 days
            </p>
          </div>
          <div className="rounded-lg sm:rounded-xl border border-[var(--bdr)] p-2.5 sm:p-3 bg-[var(--sur)] min-w-0">
            <p className="text-[9px] sm:text-[10px] text-[var(--t3)] uppercase tracking-wider leading-tight">
              Total submissions
            </p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums mt-0.5 sm:mt-1 leading-none">{entries.length}</p>
            <p className="text-[10px] sm:text-[11px] text-[var(--t2)] mt-1 leading-tight tabular-nums">
              {String(user.break_count ?? 0)} breaks
            </p>
          </div>
          <div
            className={`rounded-lg sm:rounded-xl border p-2.5 sm:p-3 min-w-0 ${
              day21Reached
                ? "border-[var(--bdr)] bg-[var(--sur)]"
                : "border-[var(--bdr)] bg-[var(--sur2)]/80"
            }`}
          >
            <p className="text-[9px] sm:text-[10px] text-[var(--t3)] uppercase tracking-wider leading-tight">
              Directive completion
            </p>
            {day21Reached ? (
              <p className="text-sm font-semibold text-[var(--t1)] mt-1.5">Unlocked</p>
            ) : (
              <div className="flex items-center gap-1.5 mt-1.5 text-[var(--t2)]">
                <svg className="shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M12 15v2M8 11V7a4 4 0 018 0v4" />
                </svg>
                <span className="text-[10px] sm:text-[11px] leading-snug">Unlocks Day 21</span>
              </div>
            )}
          </div>
          <div
            className={`rounded-lg sm:rounded-xl border p-2.5 sm:p-3 min-w-0 ${
              day21Reached
                ? "border-[var(--bdr)] bg-[var(--sur)]"
                : "border-[var(--p)]/20 bg-[var(--p)] text-[var(--fw)]"
            }`}
          >
            <p
              className={`text-[9px] sm:text-[10px] uppercase tracking-wider leading-tight ${
                day21Reached ? "text-[var(--t3)]" : "text-[var(--ca)]/90"
              }`}
            >
              Signal score
            </p>
            {day21Reached ? (
              <p className="text-sm font-semibold mt-1.5 text-[var(--t1)]">Live</p>
            ) : (
              <div className="flex items-center gap-1.5 mt-1.5 opacity-95">
                <svg className="shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M12 15v2M8 11V7a4 4 0 018 0v4" />
                </svg>
                <span className="text-[10px] sm:text-[11px] leading-snug">Unlocks Day 21</span>
              </div>
            )}
          </div>
        </div>

        {entries[0]?.tier === "upload_unverified" && (
          <p className="text-sm text-[var(--t2)] border border-[var(--bdr)] rounded-lg p-3 bg-[var(--sur)]">
            File upload is on your record as unverified. Add a Verified Proof URL from the dashboard
            within 30 days for full Signal weight.
          </p>
        )}

        {entries[0]?.tier === "signup_execution" && (
          <p className="text-sm text-[var(--t2)] border border-[var(--bdr)] rounded-lg p-3 bg-[var(--sur)]">
            Signing up was your Day 1 record. Submit your first verified proof today to build from here.
          </p>
        )}

        <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="font-semibold text-[var(--t1)]">30-Day Execution Grid</p>
              {beganDate ? (
                <p className="text-xs text-[var(--t2)] mt-0.5">Began: {beganDate}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--t2)] tabular-nums">Total: {entries.length}</span>
              <span className="text-[var(--t3)]">·</span>
              <span className="text-[var(--t2)] tabular-nums">Breaks: {String(user.break_count ?? 0)}</span>
              <span className="rounded-full bg-[var(--green)]/15 text-[var(--green)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                FOR visible
              </span>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1;
              const ent = entries.find((e) => Number(e.day_number) === day) as Record<
                string,
                string
              > | undefined;
              let cls = "border border-[var(--bdr)] bg-[var(--sur2)]";
              if (ent?.tier === "verified_proof") cls = "bg-[rgba(1,2,97,0.85)] border border-transparent";
              if (ent?.tier === "signup_execution") cls = "bg-[rgba(1,2,97,0.85)] border border-transparent";
              if (ent?.tier === "declaration_pending") cls = "bg-[var(--purple)] border-transparent";
              if (ent?.tier === "upload_unverified") cls = "bg-[var(--orange)]/90 border-transparent";
              return (
                <button
                  type="button"
                  key={day}
                  className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-md ${cls} ${ent ? "cursor-pointer hover:ring-2 ring-[var(--ac)] ring-offset-1 ring-offset-[var(--sur)]" : "cursor-default opacity-60"}`}
                  title={`Day ${day}`}
                  onClick={() => (ent ? setDayDetail(ent as unknown as Record<string, unknown>) : undefined)}
                />
              );
            })}
          </div>
          {gridLegend}
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-stretch">
          <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4 sm:p-5 flex flex-col min-h-[200px]">
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wide">
                Recent submissions
              </p>
            </div>
            {recent.length > 0 ? (
              <ul className="space-y-3 text-sm flex-1">
                {recent.map((e, idx) => (
                  <li
                    key={String(e.id)}
                    className="border-b border-[var(--bdr)]/60 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[var(--t1)] font-medium leading-snug">
                          Day {String(e.day_number)}{" "}
                          <span className="font-normal text-[var(--t2)]">
                            {submissionBrief(
                              e as {
                                tier?: string | null;
                                url?: string | null;
                                declaration_text?: string | null;
                              },
                            )}
                          </span>
                        </p>
                        <span className="inline-flex mt-1.5 rounded-md bg-[var(--p)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--fw)]">
                          {String(e.category)}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {idx === 0 ? (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--red)] whitespace-nowrap">
                            Locked · Immutable
                          </span>
                        ) : null}
                        <span className="text-[var(--t3)] text-[11px] tabular-nums">
                          {new Date(String(e.created_at)).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--t3)]">No submissions yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4 sm:p-5">
            <p className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wide mb-4">Artifact breakdown</p>
            {(["product", "distribution", "ops"] as const).map((k) => (
              <div key={k} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs text-[var(--t2)] mb-1">
                  <span className="capitalize font-medium">{k}</span>
                  <span className="tabular-nums">{Math.round((byCat[k] / totalCat) * 100)}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-[var(--sur2)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--p)] rounded-full transition-all"
                    style={{ width: `${(byCat[k] / totalCat) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {report && visibleConexaTabs.length > 0 ? (
          <div className="rounded-xl border border-[var(--bdr)] p-4 sm:p-5 bg-[var(--sur)] text-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-semibold text-[var(--t1)]">
                Conexa Intelligence · {visibleConexaTabs.length} tabs active from Day 1
              </p>
              <span className="text-[10px] uppercase tracking-wide text-[var(--purple)] font-medium">
                Day 21 unlocks 5 more
              </span>
            </div>
            <p className="text-[var(--t2)] text-xs leading-relaxed">{String(report.personal_insight ?? "")}</p>
            <div className="flex flex-wrap gap-2 border-b border-[var(--bdr)] pb-3">
              {visibleConexaTabs.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setConexaTab(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                    activeConexaKey === key
                      ? "border-[var(--p)] text-[var(--p)] bg-[var(--sur2)]"
                      : "border-[var(--bdr)] text-[var(--t2)] hover:border-[var(--p)]/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="rounded-lg bg-[var(--sur2)] border border-[var(--bdr)] p-4">
              <p className="font-semibold text-[var(--t1)] mb-2">
                {CONEXA_TAB_ORDER.find((t) => t.key === activeConexaKey)?.label ?? ""}
              </p>
              <p className="text-[var(--t2)] leading-relaxed whitespace-pre-wrap">
                {String(tabs[activeConexaKey] ?? "")}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed z-50 pointer-events-auto left-4 inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--p)] text-[var(--fw)] px-3 py-2 text-[10px] sm:text-[11px] font-semibold leading-tight shadow-lg ring-1 ring-black/10 hover:opacity-95 bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:left-[calc(max(0px,(100vw-1320px)/2)+240px)] lg:left-[calc(max(0px,(100vw-1320px)/2)+248px)] md:bottom-6"
      >
        <span className="text-[var(--ac)] text-[8px] leading-none" aria-hidden>
          ●
        </span>
        CONEXA · Ask
      </button>
      <button
        type="button"
        onClick={() => {
          setSubmitError(null);
          setDeclFiles([]);
          setModalOpen(true);
        }}
        className="fixed z-50 pointer-events-auto right-4 inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--ac)] text-[var(--mi)] px-3 py-2 text-[10px] sm:text-[11px] font-bold leading-tight shadow-lg ring-1 ring-black/10 hover:opacity-95 bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:right-[calc(100vw-max(0px,(100vw-1320px)/2)-min(1320px,100vw)+320px)] lg:right-[calc(100vw-max(0px,(100vw-1320px)/2)-min(1320px,100vw)+328px)] md:bottom-6"
      >
        <span>+ Submit Entry</span>
        <span className="tabular-nums text-[9px] font-semibold opacity-90">{windowCountdown}</span>
      </button>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-[100]">
          <div className="bg-[var(--sur)] rounded-2xl max-w-lg w-full p-6 space-y-4 text-[var(--t1)]">
            <div>
              <h2 className="text-lg font-semibold">
                {tab === "verified" ? "Verified proof" : "Declaration"}
              </h2>
              <p className="text-xs text-[var(--t2)] mt-1">
                {tab === "verified"
                  ? "Paste a public URL Conexa can validate (GitHub, Notion, etc.)."
                  : "Short attestation of what you shipped - 30-140 characters after trimming."}
              </p>
            </div>
            <div className="flex gap-2 text-sm border-b border-[var(--bdr)] pb-2">
              <button
                type="button"
                className={tab === "verified" ? "font-bold text-[var(--p)]" : "text-[var(--t2)]"}
                onClick={() => {
                  setTab("verified");
                  setDeclFiles([]);
                  setSubmitError(null);
                }}
              >
                Verified
              </button>
              <button
                type="button"
                className={tab === "declaration" ? "font-bold text-[var(--p)]" : "text-[var(--t2)]"}
                onClick={() => {
                  setTab("declaration");
                  setSubmitError(null);
                }}
              >
                Declaration
              </button>
            </div>
            {tab === "verified" ? (
              <input
                className={FORM_FIELD}
                value={proofUrl}
                onChange={(e) => {
                  setProofUrl(e.target.value);
                  setSubmitError(null);
                }}
                placeholder="https://…"
              />
            ) : (
              <>
                <textarea
                  className={`${FORM_FIELD} min-h-[100px]`}
                  value={decl}
                  onChange={(e) => {
                    setDecl(e.target.value);
                    setSubmitError(null);
                  }}
                  placeholder="What shipped today - one or two tight sentences."
                />
                <p
                  className={`text-xs ${
                    decl.trim().length < 30 || decl.trim().length > 140
                      ? "text-[var(--orange)]"
                      : "text-[var(--t3)]"
                  }`}
                >
                  {decl.trim().length} / 30-140 characters
                </p>
                <label className="block text-xs text-[var(--t2)]">
                  Attach proof (optional) — up to 3 files, 5MB each (JPG, PNG, WebP, GIF, PDF)
                </label>
                <input
                  type="file"
                  multiple
                  accept={ENTRY_UPLOAD_ACCEPT}
                  className={`${FORM_FIELD} file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--p)] file:px-3 file:py-2 file:text-[var(--fw)] file:text-xs`}
                  onChange={(e) => {
                    const files = e.target.files
                      ? Array.from(e.target.files).slice(0, 3)
                      : [];
                    setDeclFiles(files);
                    setSubmitError(null);
                  }}
                />
                {declFiles.length > 0 ? (
                  <ul className="text-xs text-[var(--t3)] space-y-1 list-disc list-inside">
                    {declFiles.map((f, i) => (
                      <li key={`${f.name}-${i}`}>
                        {f.name} ({Math.round(f.size / 1024)} KB)
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
            <select
              className={`${FORM_FIELD} cursor-pointer`}
              value={cat}
              onChange={(e) => {
                setCat(e.target.value as typeof cat);
                setSubmitError(null);
              }}
            >
              <option value="product">Product</option>
              <option value="distribution">Distribution</option>
              <option value="ops">Ops</option>
            </select>
            {submitError ? (
              <p className="text-sm text-[var(--red)] rounded-lg bg-[var(--red)]/10 border border-[var(--red)]/25 px-3 py-2">
                {submitError}
              </p>
            ) : null}
            <button
              type="button"
              className="w-full rounded-full bg-[var(--p)] text-[var(--fw)] py-2 font-semibold disabled:opacity-50"
              disabled={
                tab === "declaration" &&
                (decl.trim().length < 30 || decl.trim().length > 140)
              }
              onClick={async () => {
                let body: Record<string, unknown>;
                if (tab === "verified") {
                  body = { path: "verified", url: proofUrl.trim(), category: cat };
                } else {
                  const {
                    data: { session },
                  } = await supabase.auth.getSession();
                  if (!session?.user) {
                    setSubmitError("Your session expired. Sign in again.");
                    return;
                  }
                  let upload_paths: string[] | undefined;
                  if (declFiles.length > 0) {
                    try {
                      upload_paths = await uploadEntryDeclarationFiles(
                        supabase,
                        session.user.id,
                        declFiles,
                        "dash",
                      );
                    } catch (e) {
                      setSubmitError(
                        e instanceof Error
                          ? e.message
                          : "Upload failed. Ensure the entry-uploads bucket exists in Supabase.",
                      );
                      return;
                    }
                  }
                  body = {
                    path: "declaration",
                    declaration_text: decl.trim(),
                    category: cat,
                    ...(upload_paths?.length ? { upload_paths } : {}),
                  };
                }
                const res = await fetch("/api/entries", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "same-origin",
                  body: JSON.stringify(body),
                });
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                if (!res.ok) {
                  setSubmitError(
                    typeof j.error === "string" ? j.error : "Could not lock entry. Try again.",
                  );
                  return;
                }
                setSubmitError(null);
                setModalOpen(false);
                setProofUrl("");
                setDecl("");
                setDeclFiles([]);
                refreshShellUser();
                void loadEntries();
              }}
            >
              Lock entry
            </button>
            <button
              type="button"
              className="text-sm text-[var(--t3)]"
              onClick={() => {
                setModalOpen(false);
                setSubmitError(null);
                setDeclFiles([]);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {dayDetail && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setDayDetail(null)}
          />
          <div className="relative bg-[var(--sur)] rounded-2xl w-full max-w-md p-6 shadow-xl text-sm space-y-2">
            <p className="font-semibold">Day {String(dayDetail.day_number)}</p>
            <p className="text-[var(--t2)] capitalize">{String(dayDetail.tier).replace(/_/g, " ")}</p>
            <p className="text-[var(--t2)]">Category: {String(dayDetail.category)}</p>
            {dayDetail.url ? (
              <a
                href={String(dayDetail.url)}
                className="text-[var(--p)] break-all underline"
                target="_blank"
                rel="noreferrer"
              >
                {String(dayDetail.url)}
              </a>
            ) : null}
            {dayDetail.declaration_text ? (
              <p className="text-[var(--t2)]">{String(dayDetail.declaration_text)}</p>
            ) : null}
            {Array.isArray(dayDetail.upload_paths) && (dayDetail.upload_paths as string[]).length > 0 ? (
              <p className="text-[var(--t2)] text-xs">
                Attachments: {(dayDetail.upload_paths as string[]).length} file(s) on record (private storage).
              </p>
            ) : null}
            <button type="button" className="mt-4 text-[var(--t3)]" onClick={() => setDayDetail(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {chatOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setChatOpen(false)}
          />
          <div className="relative bg-[var(--sur)] rounded-2xl w-full max-w-md h-[70vh] flex flex-col shadow-xl">
            <header className="px-4 py-3 border-b font-semibold">CONEXA</header>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
              {chatLog.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : ""}>
                  {m.content}
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input
                className={`flex-1 min-w-0 rounded-lg border border-[var(--bdr)] bg-[var(--sur2)] px-3 py-2 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--p)]/25`}
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    const t = chatText;
                    setChatText("");
                    setChatLog((l) => [...l, { role: "user", content: t }]);
                    const res = await fetch("/api/conexa/chat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ message: t }),
                    });
                    const j = await res.json();
                    setChatLog((l) => [...l, { role: "assistant", content: j.text ?? "" }]);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  const [gateKey, setGateKey] = useState(0);

  return (
    <AuthenticatedShell
      refreshKey={gateKey}
      fullscreenBlock={(u) =>
        Boolean(u.day21_reached) && !u.day21_unlocked ? (
          <Day21Gate onUnlock={() => setGateKey((k) => k + 1)} />
        ) : null
      }
    >
      <DashboardMain />
    </AuthenticatedShell>
  );
}
