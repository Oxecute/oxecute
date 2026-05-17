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
  FIRST_PROOF_ACCEPT,
  uploadEntryDeclarationFiles,
  uploadFirstProofFiles,
} from "@/lib/entry-uploads";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
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
        Unlock what you earned
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

const ENTRY_LOCK_BUTTON =
  "w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-white bg-[#0EA472] shadow-[0_4px_16px_rgba(14,164,114,0.25)] hover:shadow-[0_4px_20px_rgba(14,164,114,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all";

function DashboardMain() {
  const user = useShellUser();
  const refreshShellUser = useShellUserRefresh();
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [breakDays, setBreakDays] = useState<number[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatLog, setChatLog] = useState<{ role: string; content: string }[]>([]);
  const [chatSending, setChatSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [decl, setDecl] = useState("");
  const [entryPath, setEntryPath] = useState<"verified" | "declaration" | "upload">("verified");
  const [uploadContext, setUploadContext] = useState("");
  const [uploadProofFiles, setUploadProofFiles] = useState<File[]>([]);
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

  const loadEntries = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const eRes = await fetch("/api/entries");
    const eJ = await eRes.json();
    setEntries(eJ.entries ?? []);
    setBreakDays(eJ.break_days ?? []);
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

  const breakDaySet = useMemo(() => new Set(breakDays), [breakDays]);

  const byCat = { product: 0, distribution: 0, ops: 0 } as Record<string, number>;
  for (const e of entries) {
    const c = String(e.category ?? "");
    if (c in byCat) byCat[c]++;
  }
  const totalCat = byCat.product + byCat.distribution + byCat.ops || 1;

  const execCount = Number(user.execution_count ?? 0);
  const day21Reached = Boolean(user.day21_reached);
  const foundingMember = Boolean(
    (user as { founding_member?: boolean }).founding_member,
  );
  const headerDay = Math.max(1, execCount);
  const headerSubtitle = `Day ${headerDay} · ${day21Reached ? "Builder" : "Record"} Tier · ${foundingMember ? "Founding" : "Free"}`;
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
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#5E6580] mt-3.5">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0EA472]" /> Verified Proof
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#7C64DC]" /> Declaration
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#C2A478]" /> Upload
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#E24B4A]" /> Break
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[2px] border border-white/[0.08] bg-white/[0.03]" /> Future
      </span>
    </div>
  );

  const utcClock = `${new Date().toISOString().slice(11, 19)} UTC`;

  const ledgerRows = [...entries]
    .sort(
      (a, b) =>
        new Date(String(b.created_at ?? 0)).getTime() - new Date(String(a.created_at ?? 0)).getTime(),
    )
    .slice(0, 6);

  const sendConexa = useCallback(async () => {
    const t = chatText.trim();
    if (!t || chatSending) return;
    setChatText("");
    setChatLog((l) => [...l, { role: "user", content: t }]);
    setChatSending(true);
    try {
      const res = await fetch("/api/conexa/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: t }),
      });
      const j = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      const reply =
        typeof j.text === "string" && j.text.trim().length > 0
          ? j.text.trim()
          : typeof j.error === "string"
            ? j.error
            : res.ok
              ? "Conexa returned an empty reply. Try again."
              : "Could not reach Conexa. Check your connection and try again.";
      setChatLog((l) => [...l, { role: "assistant", content: reply }]);
    } catch {
      setChatLog((l) => [
        ...l,
        { role: "assistant", content: "Network error. Check your connection and try again." },
      ]);
    } finally {
      setChatSending(false);
    }
  }, [chatText, chatSending]);

  return (
    <>
      <section className="rounded-[28px] border border-white/[0.055] bg-[#13151C] text-[#EAEFF8] p-5 sm:p-7 space-y-4 pb-20 md:pb-20 shadow-[0_32px_80px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4 border-b border-white/[0.055] pb-5">
          <div className="min-w-0">
            <h1
              className="text-[20px] sm:text-[22px] font-extrabold tracking-[-0.02em] text-[#EAEFF8]"
              style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
            >
              Founder Operating Record
            </h1>
            <p className="text-[12px] sm:text-[13px] text-[#5E6580] mt-1.5 leading-snug">{headerSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 sm:shrink-0 sm:ml-auto">
            <span className="inline-flex items-center rounded-full bg-[#1C1F2A] px-3.5 py-1.5 text-[12px] font-medium text-[#5E6580] ring-1 ring-white/[0.06]">
              Today
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#1C1F2A] px-3.5 py-1.5 text-[12px] font-medium text-[#A8B0CC] tabular-nums ring-1 ring-white/[0.06]">
              <svg className="w-[14px] h-[14px] shrink-0 text-[#5E6580]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
              {utcClock}
            </span>
            <button
              type="button"
              onClick={() => {
                setSubmitError(null);
                setDeclFiles([]);
                setEntryPath("verified");
                setProofUrl("");
                setDecl("");
                setUploadContext("");
                setUploadProofFiles([]);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#0EA472] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(14,164,114,0.28)] hover:opacity-95"
            >
              <span className="text-base leading-none font-bold" aria-hidden>
                +
              </span>
              Submit Entry
            </button>
          </div>
        </div>

        {gapWarn ? (
          <div className="flex items-start gap-2.5 rounded-[20px] border border-[#C2A478]/25 bg-[#C2A478]/10 px-[18px] py-3 text-[12.5px] text-[#5E6580]">
            <span className="text-[#C2A478] shrink-0 mt-0.5" aria-hidden>
              ⓘ
            </span>
            {gapWarn}
          </div>
        ) : null}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] p-5 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2E3347] mb-2.5">Days executed</p>
            <p className="text-[30px] font-bold tabular-nums leading-none tracking-tight" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
              {String(execCount)}
            </p>
            <p className="text-[11px] text-[#2E3347] mt-1.5">{execCount} of 30 days</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] p-5 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2E3347] mb-2.5">Total submissions</p>
            <p className="text-[30px] font-bold tabular-nums leading-none" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
              {entries.length}
            </p>
            <p className="text-[11px] text-[#2E3347] mt-1.5 tabular-nums">{String(user.break_count ?? 0)} breaks</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] p-5 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2E3347] mb-2.5">
              Directive completion
            </p>
            {day21Reached ? (
              <Link
                href="/directive"
                className="text-[12.5px] font-medium text-[#0EA472] hover:underline"
              >
                Open Daily Directive
              </Link>
            ) : (
              <p className="flex items-center gap-2 text-[12.5px] text-[#5E6580]">
                <svg
                  className="w-[14px] h-[14px] shrink-0 text-[#5E6580]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                </svg>
                Unlocks Day 21
              </p>
            )}
          </div>
          <div
            className={`rounded-[20px] bg-[#1C1F2A] p-5 min-w-0 ${
              day21Reached
                ? "border border-white/[0.055]"
                : "border border-[rgba(124,100,220,0.45)] shadow-[0_0_28px_rgba(124,100,220,0.14)]"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2E3347] mb-2.5">Signal score</p>
            {day21Reached ? (
              <Link
                href="/signal"
                className="text-[12.5px] font-medium text-[#7C64DC] hover:underline"
              >
                View Signal Score
              </Link>
            ) : (
              <p className="flex items-center gap-2 text-[12.5px] text-[#5E6580]">
                <svg
                  className="w-[14px] h-[14px] shrink-0 text-[#5E6580]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                </svg>
                Unlocks Day 21
              </p>
            )}
          </div>
        </div>

        {entries[0]?.tier === "upload_unverified" ? (
          <p className="text-[12.5px] text-[#5E6580] border border-white/[0.055] rounded-[20px] p-4 bg-[#1C1F2A]">
            File upload is on your record as unverified. Add a Verified Proof URL from the dashboard within 30 days for
            full Signal weight.
          </p>
        ) : null}

        <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] overflow-hidden">
          {entries[0]?.tier === "signup_execution" ? (
            <div className="px-[22px] py-3.5 border-b border-white/[0.055]">
              <p className="text-[12.5px] text-[#5E6580] leading-snug">
                Signing up was your Day 1 record. Submit your first verified proof today to build from here.
              </p>
            </div>
          ) : null}
          <div className="p-5 sm:p-[22px]">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[14.5px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                  30-Day Execution Grid
                </p>
                {beganDate ? <p className="text-[11.5px] text-[#2E3347] mt-0.5">Began {beganDate}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11.5px]">
                <span className="text-[#5E6580] tabular-nums">
                  Total: {entries.length} | Breaks: {String(user.break_count ?? 0)} |{" "}
                  <span className="text-[11.5px] font-medium text-[#0EA472]">FOR visible</span>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const ent = entries.find((e) => Number(e.day_number) === day) as Record<string, string> | undefined;
                const isBreakDay = breakDaySet.has(day);
                let cls = "border border-white/[0.055] bg-white/[0.025]";
                if (ent?.tier === "verified_proof" || ent?.tier === "signup_execution") {
                  cls = "bg-[#0EA472] border-[#0EA472] shadow-[0_2px_8px_rgba(14,164,114,0.3)]";
                } else if (ent?.tier === "declaration_pending") {
                  cls = "bg-[rgba(124,100,220,0.15)] border-[rgba(124,100,220,0.25)]";
                } else if (ent?.tier === "upload_unverified") {
                  cls = "bg-[rgba(194,164,120,0.15)] border-[rgba(194,164,120,0.25)]";
                } else if (isBreakDay) {
                  cls = "bg-[#E24B4A] border-[#E24B4A] shadow-[0_2px_8px_rgba(226,75,74,0.3)]";
                }
                const isFutureSlot = !ent && !isBreakDay;
                return (
                  <button
                    type="button"
                    key={day}
                    className={`w-7 h-7 sm:w-[30px] sm:h-[30px] shrink-0 rounded-[6px] transition-transform hover:scale-105 ${cls} ${
                      ent ? "cursor-pointer" : "cursor-default"
                    } ${isFutureSlot ? "opacity-50" : ""}`}
                    title={isBreakDay && !ent ? `Day ${day} · Break` : `Day ${day}`}
                    onClick={() => (ent ? setDayDetail(ent as unknown as Record<string, unknown>) : undefined)}
                  />
                );
              })}
            </div>
            {gridLegend}
          </div>
        </div>

        <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-[22px] py-4 border-b border-white/[0.055]">
            <div>
              <p className="text-[14.5px] font-semibold" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                Execution Ledger
              </p>
              <p className="text-[11.5px] text-[#2E3347] mt-0.5">Auto-captured · tamper-proof · append-only</p>
            </div>
          </div>
          <div className="p-5 space-y-2">
            {ledgerRows.length === 0 ? (
              <p className="text-[12.5px] text-[#5E6580]">No ledger rows yet.</p>
            ) : (
              ledgerRows.map((e) => {
                const tier = String(e.tier ?? "");
                const ts = new Date(String(e.created_at ?? 0)).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                let rowCls = "border-[rgba(79,70,229,0.28)] bg-[rgba(79,70,229,0.12)]";
                let badge = "Verified";
                let badgeCls = "bg-[rgba(14,164,114,0.15)] text-[#0EA472] border-[rgba(14,164,114,0.25)]";
                if (tier === "declaration_pending" || tier === "upload_unverified") {
                  rowCls = "border-[rgba(194,164,120,0.25)] bg-[rgba(194,164,120,0.1)]";
                  badge = "Declared";
                  badgeCls = "bg-[rgba(194,164,120,0.15)] text-[#C2A478] border-[rgba(194,164,120,0.25)]";
                }
                if (tier === "verified_proof" || tier === "signup_execution") {
                  rowCls = "border-[rgba(14,164,114,0.25)] bg-[rgba(14,164,114,0.1)]";
                  badge = "Verified";
                  badgeCls = "bg-[rgba(14,164,114,0.15)] text-[#0EA472] border-[rgba(14,164,114,0.25)]";
                }
                const title = submissionBrief(
                  e as { tier?: string | null; url?: string | null; declaration_text?: string | null },
                );
                return (
                  <div
                    key={String(e.id)}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] border ${rowCls}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#EAEFF8]">
                        Day {String(e.day_number)} · {title}
                      </p>
                      <p className="text-[11px] text-[#5E6580] mt-0.5">{ts} UTC</p>
                    </div>
                    <span className={`text-[9.5px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border shrink-0 ${badgeCls}`}>
                      {badge}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3.5">
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] overflow-hidden">
            <div className="px-[22px] py-4 border-b border-white/[0.055]">
              <p className="text-[14.5px] font-semibold" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                Recent Submissions
              </p>
            </div>
            <div className="p-5 pt-2">
              {recent.length > 0 ? (
                <ul className="divide-y divide-white/[0.055]">
                  {recent.map((e, idx) => (
                    <li key={String(e.id)} className="py-3.5 first:pt-0 last:pb-0">
                      <p className="text-[13.5px] font-semibold" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                        Day {String(e.day_number)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[10.5px] mt-1">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wide bg-[rgba(79,70,229,0.15)] text-[#8B82F5] border border-[rgba(79,70,229,0.28)]">
                          {String(e.category)}
                        </span>
                        {idx === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[#E24B4A] font-semibold">
                            <span aria-hidden>🔒</span> Locked · Immutable
                          </span>
                        ) : null}
                        <span className="text-[#2E3347] tabular-nums ml-auto">
                          {new Date(String(e.created_at)).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12.5px] text-[#5E6580] py-4">No submissions yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] overflow-hidden">
            <div className="px-[22px] py-4 border-b border-white/[0.055]">
              <p className="text-[14.5px] font-semibold" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                Artifact Breakdown
              </p>
            </div>
            <div className="p-5 space-y-3.5">
              {(["product", "distribution", "ops"] as const).map((k) => (
                <div key={k}>
                  <div className="flex justify-between text-[12.5px] mb-1.5">
                    <span className="text-[#5E6580] capitalize">{k}</span>
                    <span className="font-medium text-[#EAEFF8] tabular-nums">{Math.round((byCat[k] / totalCat) * 100)}%</span>
                  </div>
                  <div className="h-1 rounded-sm bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-sm ${k === "product" ? "bg-[#0EA472]" : k === "distribution" ? "bg-[#7C64DC]" : "bg-[#2E3347]"}`}
                      style={{ width: `${(byCat[k] / totalCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {report && visibleConexaTabs.length > 0 ? (
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] overflow-hidden text-[12.5px]">
            <div className="flex flex-wrap items-start justify-between gap-2 px-[22px] py-4 border-b border-white/[0.055]">
              <p className="text-[14.5px] font-semibold" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                Conexa Intelligence{" "}
                <span className="text-xs font-normal text-[#5E6580]">
                  · {visibleConexaTabs.length} tabs active from Day 1
                </span>
              </p>
            </div>
            <div className="flex gap-0.5 overflow-x-auto border-b border-white/[0.055] px-[22px] scrollbar-none">
              {visibleConexaTabs.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setConexaTab(key)}
                  className={`shrink-0 px-[13px] py-[11px] text-xs whitespace-nowrap border-b-2 transition-colors ${
                    activeConexaKey === key
                      ? "text-[#EAEFF8] border-[#0EA472]"
                      : "text-[#2E3347] border-transparent hover:text-[#5E6580]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="p-5 sm:px-[22px] sm:pb-[22px]">
              <div className="rounded-[14px] border border-white/[0.055] bg-white/[0.025] px-[18px] py-4">
                <p className="text-[13.5px] font-semibold mb-2" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                  {CONEXA_TAB_ORDER.find((t) => t.key === activeConexaKey)?.label ?? ""}
                </p>
                <p className="text-[12.5px] text-[#5E6580] leading-[1.75] whitespace-pre-wrap break-words">
                  {String(tabs[activeConexaKey] ?? "")}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed z-50 pointer-events-auto left-4 inline-flex shrink-0 items-center gap-1 rounded-full bg-[#4F46E5] text-white px-3 py-2 text-[10px] sm:text-[11px] font-semibold leading-tight shadow-lg ring-1 ring-black/10 hover:opacity-95 bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:left-[calc(240px+0.75rem+1rem)] lg:left-[calc(248px+1rem+1.25rem)] md:bottom-6"
      >
        <span className="text-[#c8f542] text-[8px] leading-none" aria-hidden>
          ●
        </span>
        CONEXA · Ask
      </button>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-[100]">
          <div className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.11] bg-[#0d0f1a] shadow-[0_24px_60px_rgba(0,0,0,0.45)] text-[#EAEFF8]">
            <div className="px-6 md:px-8 pt-7 pb-5 border-b border-white/[0.06] space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#4F46E5]">
                {entries.length === 0 ? "First entry" : "Daily entry"}
              </p>
              <h2
                className="text-[22px] sm:text-[26px] font-extrabold text-[#EAEFF8] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
              >
                {entries.length === 0 ? "Submit your first proof." : "Submit today's proof."}
              </h2>
              <p className="text-[13px] font-light text-[#5E6580] leading-relaxed">
                {entries.length === 0
                  ? "Your record starts the moment you submit. Choose your path."
                  : "One lock per UTC day. Choose how you are proving today's execution."}
              </p>
            </div>
            <div className="px-6 md:px-8 py-7 space-y-5">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setEntryPath("verified");
                    setDeclFiles([]);
                    setUploadProofFiles([]);
                    setUploadContext("");
                    setSubmitError(null);
                  }}
                  className={`w-full text-left rounded-xl border p-4 transition-colors ${
                    entryPath === "verified"
                      ? "border-[var(--ac)] bg-[var(--ac)]/5"
                      : "border-white/10 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="mt-0.5 text-[var(--ac)] shrink-0" aria-hidden>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6 9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>
                      <span className="block font-semibold text-[#EAEFF8]">Verified Proof</span>
                      <span className="mt-1 block text-xs text-[#5E6580] leading-snug">
                        External URL · HEAD request validates immediately · Full Signal Score weight
                      </span>
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryPath("declaration");
                    setProofUrl("");
                    setUploadProofFiles([]);
                    setUploadContext("");
                    setSubmitError(null);
                  }}
                  className={`w-full text-left rounded-xl border p-4 transition-colors ${
                    entryPath === "declaration"
                      ? "border-[var(--ac)] bg-[var(--ac)]/5"
                      : "border-white/10 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <div className="flex gap-3">
                    <span
                      className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-[var(--ac)]"
                      aria-hidden
                    />
                    <span>
                      <span className="block font-semibold text-[#EAEFF8]">Declaration</span>
                      <span className="mt-1 block text-xs text-[#5E6580] leading-snug">
                        Stated intent · 30–140 chars · Upgrade within 30 days
                      </span>
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryPath("upload");
                    setProofUrl("");
                    setDecl("");
                    setDeclFiles([]);
                    setSubmitError(null);
                  }}
                  className={`w-full text-left rounded-xl border p-4 transition-colors ${
                    entryPath === "upload"
                      ? "border-[var(--ac)] bg-[var(--ac)]/5"
                      : "border-white/10 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="mt-0.5 text-[var(--ac)] shrink-0" aria-hidden>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                      </svg>
                    </span>
                    <span>
                      <span className="block font-semibold text-[#EAEFF8]">Upload</span>
                      <span className="mt-1 block text-xs text-[#5E6580] leading-snug">
                        File upload · PDF, DOCX, PNG, PPTX, XLSX · Max 10MB each · Up to 3 files
                      </span>
                    </span>
                  </div>
                </button>
              </div>

              {entryPath === "verified" ? (
                <div className="space-y-3">
                  <input
                    className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2.5 text-[#EAEFF8] placeholder:text-[#5E6580]/80 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
                    value={proofUrl}
                    onChange={(e) => {
                      setProofUrl(e.target.value);
                      setSubmitError(null);
                    }}
                    placeholder="https://…"
                  />
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300 whitespace-nowrap">
                      Verified proof · Live
                    </span>
                    <p className="text-xs text-[#5E6580]">Highest Signal weight when the URL validates.</p>
                  </div>
                </div>
              ) : null}

              {entryPath === "declaration" ? (
                <div className="space-y-3">
                  <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-[#5E6580] leading-relaxed">
                    What are you building today? What will prove it&apos;s done? · 30–140 chars
                  </label>
                  <div className="relative">
                    <textarea
                      className={`w-full min-h-[128px] rounded-lg bg-black/30 border px-3 py-2 pr-3 pb-9 text-[#EAEFF8] placeholder:text-[#5E6580]/60 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 ${
                        decl.trim().length > 0 && decl.trim().length < 30
                          ? "border-amber-500/50"
                          : "border-white/10"
                      }`}
                      value={decl}
                      maxLength={140}
                      onChange={(e) => {
                        setDecl(e.target.value);
                        setSubmitError(null);
                      }}
                      placeholder="Be specific."
                    />
                    <span className="absolute bottom-2 right-3 text-xs tabular-nums text-[#5E6580]">
                      {decl.length}/140
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/35 bg-amber-950/40 px-3 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-200 whitespace-nowrap">
                      Declaration · Pending
                    </span>
                    <p className="text-xs text-[#5E6580]">
                      Upgrade within 30 days with a Verified Proof URL.
                    </p>
                  </div>
                  <label className="block text-xs text-[#5E6580]">
                    Attach proof (optional) — up to 3 files, 5MB each (JPG, PNG, WebP, GIF, PDF)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept={ENTRY_UPLOAD_ACCEPT}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#EAEFF8] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ac)] file:px-3 file:py-2 file:text-[#0d0f1a] file:text-xs file:font-semibold"
                    onChange={(e) => {
                      const files = e.target.files
                        ? Array.from(e.target.files).slice(0, 3)
                        : [];
                      setDeclFiles(files);
                      setSubmitError(null);
                    }}
                  />
                  {declFiles.length > 0 ? (
                    <ul className="text-xs text-[#5E6580] space-y-1 list-disc list-inside">
                      {declFiles.map((f, i) => (
                        <li key={`${f.name}-${i}`}>
                          {f.name} ({Math.round(f.size / 1024)} KB)
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {entryPath === "upload" ? (
                <div className="space-y-3">
                  <span className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-[#5E6580]">
                    Upload file
                  </span>
                  <input
                    type="file"
                    multiple
                    accept={FIRST_PROOF_ACCEPT}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#EAEFF8] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ac)] file:px-3 file:py-2 file:text-[#0d0f1a] file:text-xs file:font-semibold"
                    onChange={(e) => {
                      const files = e.target.files
                        ? Array.from(e.target.files).slice(0, 3)
                        : [];
                      setUploadProofFiles(files);
                      setSubmitError(null);
                    }}
                  />
                  {uploadProofFiles.length > 0 ? (
                    <ul className="text-xs text-[#5E6580] space-y-1 list-disc list-inside">
                      {uploadProofFiles.map((f, i) => (
                        <li key={`${f.name}-${i}`}>
                          {f.name} ({Math.round(f.size / 1024)} KB)
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-[#5E6580] leading-relaxed">
                    What was made? · 30–140 chars required
                  </label>
                  <div className="relative">
                    <textarea
                      className={`w-full min-h-[100px] rounded-lg bg-black/30 border px-3 py-2 pb-9 text-[#EAEFF8] placeholder:text-[#5E6580]/60 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 ${
                        uploadContext.trim().length > 0 && uploadContext.trim().length < 30
                          ? "border-amber-500/50"
                          : "border-white/10"
                      }`}
                      placeholder="Context sentence…"
                      maxLength={140}
                      value={uploadContext}
                      onChange={(e) => {
                        setUploadContext(e.target.value);
                        setSubmitError(null);
                      }}
                    />
                    <span className="absolute bottom-2 right-3 text-xs tabular-nums text-[#5E6580]">
                      {uploadContext.length}/140
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-violet-500/35 bg-violet-950/35 px-3 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-200 whitespace-nowrap">
                      Submission · Unverified
                    </span>
                    <p className="text-xs text-[#5E6580]">
                      Link a Verified Proof within 30 days for full Signal weight.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <span className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-[#5E6580]">
                  Work type
                </span>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["product", "Product"] as const,
                      ["distribution", "Distribution"] as const,
                      ["ops", "Ops"] as const,
                    ]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setCat(id);
                        setSubmitError(null);
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                        cat === id
                          ? "border-blue-400/50 bg-blue-950/80 text-white"
                          : "border-white/20 text-[#5E6580] hover:border-[var(--ac)]/45"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {submitError ? (
                <p className="text-sm text-amber-200 rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2">
                  {submitError}
                </p>
              ) : null}

              <button
                type="button"
                className={ENTRY_LOCK_BUTTON}
                disabled={
                  (entryPath === "verified" && proofUrl.trim().length < 8) ||
                  (entryPath === "declaration" &&
                    (decl.trim().length < 30 || decl.trim().length > 140)) ||
                  (entryPath === "upload" &&
                    (uploadProofFiles.length < 1 ||
                      uploadContext.trim().length < 30 ||
                      uploadContext.trim().length > 140))
                }
                onClick={async () => {
                  let body: Record<string, unknown>;
                  if (entryPath === "verified") {
                    body = { path: "verified", url: proofUrl.trim(), category: cat };
                  } else if (entryPath === "declaration") {
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
                  } else {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();
                    if (!session?.user) {
                      setSubmitError("Your session expired. Sign in again.");
                      return;
                    }
                    let upload_paths: string[];
                    try {
                      upload_paths = await uploadFirstProofFiles(
                        supabase,
                        session.user.id,
                        uploadProofFiles,
                      );
                    } catch (e) {
                      setSubmitError(e instanceof Error ? e.message : "Upload failed.");
                      return;
                    }
                    body = {
                      path: "upload",
                      context_text: uploadContext.trim(),
                      category: cat,
                      upload_paths,
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
                  setUploadContext("");
                  setUploadProofFiles([]);
                  setEntryPath("verified");
                  refreshShellUser();
                  void loadEntries();
                }}
              >
                {entries.length === 0 ? "Start My record" : "Lock entry"}
              </button>
              <button
                type="button"
                className="text-sm text-[#5E6580] hover:text-[#EAEFF8]"
                onClick={() => {
                  setModalOpen(false);
                  setSubmitError(null);
                  setDeclFiles([]);
                  setUploadProofFiles([]);
                  setUploadContext("");
                  setEntryPath("verified");
                }}
              >
                Cancel
              </button>
            </div>
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
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setChatOpen(false)}
          />
          <div className="relative rounded-2xl w-full max-w-md h-[70vh] max-h-[min(70vh,640px)] flex flex-col shadow-xl border border-white/[0.08] bg-[#13151C] text-[#EAEFF8]">
            <header className="px-4 py-3 border-b border-white/[0.055] flex items-center justify-between gap-2">
              <span className="font-semibold text-[15px] tracking-tight">CONEXA</span>
              <button
                type="button"
                className="text-[12px] text-[#5E6580] hover:text-[#EAEFF8]"
                onClick={() => setChatOpen(false)}
              >
                Close
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {chatLog.length === 0 ? (
                <p className="text-[13px] text-[#5E6580] leading-relaxed">
                  Ask Conexa about your execution record, blockers, or what to ship next. Messages use your FOR context
                  on the server.
                </p>
              ) : null}
              {chatLog.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-[12px] px-3 py-2.5 border ${
                      m.role === "user"
                        ? "bg-[#0EA472]/15 text-[#EAEFF8] border-[#0EA472]/25"
                        : "bg-white/[0.04] text-[#C8D0E0] border-white/[0.06]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-left">
                      {m.content || (m.role === "assistant" ? "…" : "")}
                    </p>
                  </div>
                </div>
              ))}
              {chatSending ? (
                <div className="flex justify-start">
                  <div className="rounded-[12px] px-3 py-2.5 border border-white/[0.06] bg-white/[0.04] text-[#5E6580] text-[13px]">
                    Thinking…
                  </div>
                </div>
              ) : null}
            </div>
            <div className="p-3 border-t border-white/[0.055] flex gap-2 bg-[#1C1F2A]">
              <input
                className="flex-1 min-w-0 rounded-[10px] border border-[rgba(255,255,255,0.055)] bg-[#1C1F2A] px-3 py-2.5 text-sm text-[#EAEFF8] placeholder:text-[#5E6580] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
                value={chatText}
                placeholder="Message Conexa…"
                disabled={chatSending}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendConexa();
                  }
                }}
              />
              <button
                type="button"
                disabled={chatSending || !chatText.trim()}
                className="shrink-0 rounded-[10px] bg-[#4F46E5] text-white px-4 py-2 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 shadow-[0_4px_16px_rgba(79,70,229,0.22)]"
                onClick={() => void sendConexa()}
              >
                Send
              </button>
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
