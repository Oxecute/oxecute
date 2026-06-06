"use client";

import { AuthenticatedShell, useShellUser, useShellUserRefresh } from "@/components/app/AuthenticatedShell";
import type { AppShellUser } from "@/components/app/AppShell";
import { utcTodayISO } from "@/lib/dates";

import {
  ENTRY_UPLOAD_ACCEPT,
  FIRST_PROOF_ACCEPT,
  uploadEntryDeclarationFiles,
  uploadFirstProofFiles,
} from "@/lib/entry-uploads";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

function Day21Gate({ user, onUnlock }: { user: AppShellUser; onUnlock: () => void }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refCode = user.referral_code || "";
  const referralLink = `oxecute.com/signup?ref=${refCode}`;
  const prewrittenCaption = `21 days executed on Oxecute. No streak required. Just 21 days of verified proof. If you're building and leaving no trace, start here: ${referralLink}`;

  const copyToClipboard = async (text: string, type: "link" | "caption") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const [referralRewardText, setReferralRewardText] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("referral_rewards")
        .select("tier_reached")
        .eq("user_id", user.id);
      
      if (data && data.length > 0) {
        const tiers = data.map((r) => r.tier_reached);
        if (tiers.includes("5_paid")) {
          setReferralRewardText("5 paid referrals — 50% off for 3 months applied to your next billing cycle.");
        } else if (tiers.includes("3_paid")) {
          setReferralRewardText("3 of your referrals just subscribed — 3 months free credited.");
        } else if (tiers.includes("5_onboarded")) {
          setReferralRewardText("5 founders onboarded — 1 month free locked.");
        } else if (tiers.includes("3_onboarded")) {
          setReferralRewardText("3 founders onboarded through your link — 50% off locked.");
        } else if (tiers.includes("1_onboarded")) {
          setReferralRewardText("1 founder onboarded through your link — 25% off your first month locked.");
        }
      }
    };
    void fetchRewards();
  }, [user.id]);

  const handleUnlock = async (tierSelected: "builder" | "free") => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day21_unlocked: true, tier: tierSelected }),
      });
      if (res.ok) {
        if (tierSelected === "builder") {
          setToastMessage("Builder tier locked in. Billing activates when payments launch. You'll hear from Ashwinni directly.");
          setTimeout(() => {
            onUnlock();
          }, 3500);
        } else {
          onUnlock();
        }
      } else {
        alert("Failed to save. Try again.");
        setLoading(false);
      }
    } catch {
      alert("Network error.");
      setLoading(false);
    }
  };

  const isIndia = user.country?.toLowerCase() === "india";

  return (
    <main className="min-h-screen bg-[#08080F] text-[#EAEFF8] flex flex-col font-sans relative overflow-x-hidden w-full select-none">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="max-w-4xl w-full mx-auto px-6 py-6 flex items-center justify-between z-10 shrink-0">
        <span className="text-[17px] font-extrabold tracking-tight text-white select-none">
          Oxe<span className="text-[#DEF408]">c</span>ute
        </span>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-6 pb-20 flex flex-col gap-8 justify-center z-10">
        
        {/* Title Section */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-[0.16em] text-[#DEF408] uppercase">
            21 DAYS EXECUTED · VERIFIED OPERATOR
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
            21 days executed. Here&apos;s what you&apos;ve earned.
          </h1>
        </div>

        {/* Big Execution Counter Grid Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="block text-[44px] font-black text-[#DEF408] leading-none select-all font-mono">
              21
            </span>
            <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Days Executed
            </span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-right space-y-1">
            <span className="block text-lg font-bold text-zinc-200 tabular-nums">
              {String(user.break_count ?? 0)}
            </span>
            <span className="block text-[10px] font-semibold text-ox-t3 uppercase tracking-wider">
              breaks on record
            </span>
          </div>
        </div>

        {/* What Just Unlocked List */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-ox-t3 uppercase tracking-widest border-b border-white/[0.06] pb-2">
            Features Unlocking Today
          </p>
          <ul className="space-y-4 text-sm">
            {[
              {
                title: "1. Signal Score",
                desc: "Your execution record quantified as a single score (0–100) factoring rate, consistency, and discipline."
              },
              {
                title: "2. Daily Directive",
                desc: "One tailored action statement, one specific proof requirement, generated nightly from your record."
              },
              {
                title: "3. Conexa Intelligence",
                desc: "5 additional intelligence tabs reading and diagnosing your 21 days of actual execution behaviour."
              },
              {
                title: "4. Day 21 Achievement Card",
                desc: "A shareable, cryptographically verified record achievement card to display your proof of execution."
              },
              {
                title: "5. Builder Tier",
                desc: "Permanent access to the complete execution record infrastructure, with lock-rate price protection."
              }
            ].map((item, index) => (
              <li key={index} className="space-y-1 flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#DEF408] mt-2 shrink-0" />
                <div>
                  <strong className="text-white block font-semibold text-[14.5px]" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>{item.title}</strong>
                  <span className="text-[12.5px] text-zinc-400 leading-relaxed block mt-0.5">{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Referral Reward Block */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5 space-y-3.5">
          {referralRewardText ? (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[#0EA472] uppercase tracking-wider block">
                ✓ Referral Reward Unlocked
              </span>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {referralRewardText}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-ox-t3 uppercase tracking-wider block">
                  Share What You Just Unlocked
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Refer 1 founder before you subscribe and get 25% off this month.
                </p>
              </div>
              
              <div className="flex items-center gap-2 rounded-xl bg-black/40 border border-white/10 px-3.5 py-2">
                <span className="text-xs text-zinc-300 font-mono select-all break-all flex-1">{referralLink}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(referralLink, "link")}
                  className="shrink-0 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 px-3 py-1.5 text-xs font-semibold transition-all"
                >
                  {copiedLink ? "Copied!" : "Copy link"}
                </button>
              </div>

              <div className="rounded-xl bg-black/25 border border-white/[0.06] p-3 text-xs text-zinc-400 relative italic leading-relaxed">
                &ldquo;{prewrittenCaption}&rdquo;
                <button
                  type="button"
                  onClick={() => copyToClipboard(prewrittenCaption, "caption")}
                  className="absolute bottom-2 right-2 rounded bg-white/[0.06] hover:bg-white/[0.1] text-[10px] text-zinc-300 px-2 py-1 font-semibold transition-all"
                >
                  {copiedCaption ? "Copied!" : "Copy post"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Reveal Card */}
        <div className="rounded-2xl border border-[rgba(222,244,8,0.22)] bg-[rgba(222,244,8,0.03)] p-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>Builder Tier</span>
            <div className="text-right">
              <span className="text-2xl font-black text-[#DEF408] tabular-nums">$29</span>
              <span className="text-xs text-zinc-400">/month</span>
              {isIndia && (
                <div className="text-xs text-zinc-400 mt-0.5">
                  India: <span className="text-[#DEF408] font-bold tabular-nums">₹1,199</span>/month
                </div>
              )}
            </div>
          </div>
          <div className="h-px bg-white/10" />
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            Your rate is locked from today for as long as your subscription stays active. Cancellation voids the lock permanently. Resubscription is at the current market rate.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3.5 pt-4 shrink-0">
          <button
            type="button"
            disabled={loading}
            className="w-full min-h-[50px] rounded-xl bg-[#DEF408] hover:opacity-95 text-[#08080F] font-bold text-sm tracking-wide transition-all shadow-[0_4px_24px_rgba(222,244,8,0.18)] disabled:opacity-40"
            onClick={() => handleUnlock("builder")}
          >
            {loading ? "Unlocking..." : "Unlock what you earned →"}
          </button>
          
          <button
            type="button"
            disabled={loading}
            className="w-full min-h-[50px] rounded-xl border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white bg-white/[0.02] text-xs font-semibold transition-all"
            onClick={() => handleUnlock("free")}
          >
            Continue on free tier
          </button>
        </div>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%] rounded-xl border border-emerald-500/30 bg-emerald-950/95 text-emerald-200 px-4 py-3.5 text-xs text-left shadow-2xl flex items-start gap-2.5 animate-[slideUp_0.3s_ease-out]">
          <style>{`
            @keyframes slideUp {
              from { transform: translate(-50%, 20px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
          <span className="text-emerald-400 text-sm mt-0.5 font-bold">✓</span>
          <p className="leading-relaxed">{toastMessage}</p>
        </div>
      )}
    </main>
  );
}

const ENTRY_LOCK_BUTTON =
  "w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-white bg-[#0EA472] shadow-[0_4px_16px_rgba(14,164,114,0.25)] hover:shadow-[0_4px_20px_rgba(14,164,114,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all";

function DashboardMainInner() {
  const user = useShellUser();
  const refreshShellUser = useShellUserRefresh();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [activeDirective, setActiveDirective] = useState<Record<string, unknown> | null>(null);
  const [directiveStats, setDirectiveStats] = useState<{ completion_rate: number } | null>(null);
  const [dashProofUrl, setDashProofUrl] = useState("");
  const [dashProofFiles, setDashProofFiles] = useState<File[]>([]);
  const [dashSubmitting, setDashSubmitting] = useState(false);
  const [dashError, setDashError] = useState<string | null>(null);
  const [dashSuccess, setDashSuccess] = useState<string | null>(null);
  const [breakDays, setBreakDays] = useState<number[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const [conexaDrawerOpen, setConexaDrawerOpen] = useState(false);
  const [conexaTab, setConexaTab] = useState<string>("reality_check");

  const resolvedEntries = useMemo(() => {
    const map = new Map<number, Record<string, unknown>>();
    // Sort so that upgraded entries (which have upgraded_from_id) overwrite the originals
    const sorted = [...entries].sort((a, b) => {
      const aUp = !!a.upgraded_from_id;
      const bUp = !!b.upgraded_from_id;
      if (aUp && !bUp) return 1;
      if (!aUp && bUp) return -1;
      return 0;
    });
    for (const e of sorted) {
      map.set(Number(e.day_number), e);
    }
    return Array.from(map.values());
  }, [entries]);

  const logItems = useMemo(() => {
    const items: {
      type: "entry" | "break";
      day_number: number;
      entry_number?: number;
      category?: string;
      tier?: string;
      url?: string | null;
      declaration_text?: string | null;
      upload_paths?: string[] | null;
      context_sentence?: string | null;
      created_at: string;
      raw: Record<string, unknown>;
    }[] = [];

    for (const e of entries) {
      items.push({
        type: "entry",
        day_number: Number(e.day_number),
        entry_number: Number(e.entry_number),
        category: String(e.category || "product"),
        tier: String(e.tier || ""),
        url: e.url as string | null,
        declaration_text: e.declaration_text as string | null,
        upload_paths: e.upload_paths as string[] | null,
        context_sentence: e.context_sentence as string | null,
        created_at: String(e.created_at || ""),
        raw: e as Record<string, unknown>,
      });
    }

    for (const b of breakDays) {
      const start = new Date(String(user.created_at));
      const targetDate = new Date(start.getTime() + (b - 1) * 24 * 60 * 60 * 1000);
      items.push({
        type: "break",
        day_number: b,
        created_at: targetDate.toISOString(),
        raw: {
          day_number: b,
          tier: "break",
          message: "This gap is part of your record. Break marks are permanent.",
        },
      });
    }

    return items.sort((a, b) => b.day_number - a.day_number);
  }, [entries, breakDays, user.created_at]);

  const [relatesToPrevious, setRelatesToPrevious] = useState(false);
  const [selectedUpgradeId, setSelectedUpgradeId] = useState("");

  const upgradableEntries = useMemo(() => {
    const upgradedIds = new Set(
      entries.map((e) => e.upgraded_from_id).filter(Boolean) as string[],
    );
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return entries.filter((e) => {
      const isUpgradableTier =
        e.tier === "declaration_pending" || e.tier === "upload_unverified";
      const isWithin30Days =
        new Date(String(e.created_at ?? 0)).getTime() >= thirtyDaysAgo;
      const isNotUpgradedYet = !upgradedIds.has(String(e.id));
      return isUpgradableTier && isWithin30Days && isNotUpgradedYet;
    });
  }, [entries]);

  const submitDashProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDirective || !dashProofUrl.trim()) return;

    setDashSubmitting(true);
    setDashError(null);
    setDashSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Your session expired. Sign in again.");
      }

      let upload_paths: string[] | undefined;
      if (dashProofFiles.length > 0) {
        try {
          upload_paths = await uploadEntryDeclarationFiles(
            supabase,
            session.user.id,
            dashProofFiles,
            "directive",
          );
        } catch (e) {
          throw new Error(
            e instanceof Error
              ? e.message
              : "Upload failed. Ensure the entry-uploads bucket exists in Supabase.",
          );
        }
      }

      const res = await fetch("/api/directives/submit-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directive_id: activeDirective.id,
          proof_url: dashProofUrl.trim(),
          upload_paths,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit proof");
      }

      setDashSuccess(data.acknowledgment || "Proof successfully verified.");
      setDashProofUrl("");
      setDashProofFiles([]);
      void loadEntries();
      router.refresh();
    } catch (err) {
      const eMsg = err instanceof Error ? err.message : "Validation failed.";
      setDashError(eMsg);
    } finally {
      setDashSubmitting(false);
    }
  };

  // Referral states
  const [onboardedCount, setOnboardedCount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const loadReferrals = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: refRows } = await supabase
      .from("referrals")
      .select("onboarding_completed, subscription_valid")
      .eq("referrer_user_id", session.user.id);
    
    if (refRows) {
      setOnboardedCount(refRows.filter((r: { onboarding_completed: boolean }) => r.onboarding_completed).length);
      setPaidCount(refRows.filter((r: { subscription_valid: boolean }) => r.subscription_valid).length);
    }
  }, [supabase]);

  const loadEntries = useCallback(async () => {
    try {
      setLoadError(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const [eRes, dRes] = await Promise.all([
        fetch("/api/entries"),
        fetch("/api/directives")
      ]);
      if (!eRes.ok) {
        throw new Error(`Failed to load entries: ${eRes.status}`);
      }
      const eJ = await eRes.json();
      setEntries(eJ.entries ?? []);
      setBreakDays(eJ.break_days ?? []);

      if (dRes.ok) {
        const dJ = await dRes.json();
        setActiveDirective(dJ.active);
        setDirectiveStats(dJ.stats);
      }
      void loadReferrals();
    } catch (e) {
      console.error(e);
      setLoadError("API timeout or connection lost. Please check your network and try again.");
    }
  }, [supabase.auth, loadReferrals]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const openEntryModal = useCallback(() => {
    setSubmitError(null);
    setDeclFiles([]);
    setUploadProofFiles([]);
    setUploadContext("");
    setProofUrl("");
    setDecl("");
    setEntryPath("verified");
    setRelatesToPrevious(false);
    setSelectedUpgradeId("");
    setModalOpen(true);
  }, []);

  useEffect(() => {
    const onOpen = () => openEntryModal();
    window.addEventListener("oxe:open-submit-entry", onOpen);
    return () => window.removeEventListener("oxe:open-submit-entry", onOpen);
  }, [openEntryModal]);

  useEffect(() => {
    if (searchParams.get("submit") !== "1") return;
    openEntryModal();
    router.replace("/dashboard", { scroll: false });
  }, [searchParams, router, openEntryModal]);

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

  const execCount = Number(user.execution_count ?? 0);
  const day21Reached = Boolean(user.day21_reached);

  const refCode = user.referral_code || "";
  const referralLink = `oxecute.com/signup?ref=${refCode}`;
  const prewrittenCaption = `21 days executed on Oxecute. No streak required. Just 21 days of verified proof. If you're building and leaving no trace, start here: ${referralLink}`;

  const copyToClipboard = useCallback(async (text: string, type: "link" | "caption") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  }, []);

  const recent = [...resolvedEntries]
    .sort(
      (a, b) =>
        new Date(String(b.created_at ?? 0)).getTime() -
        new Date(String(a.created_at ?? 0)).getTime(),
    )
    .slice(0, 6);

  const breakDaySet = useMemo(() => new Set(breakDays), [breakDays]);

  const byCat = { product: 0, distribution: 0, ops: 0 } as Record<string, number>;
  for (const e of resolvedEntries) {
    const c = String(e.category ?? "");
    if (c in byCat) byCat[c]++;
  }
  const totalCat = byCat.product + byCat.distribution + byCat.ops || 1;

  const beganDate =
    user.created_at != null
      ? new Date(user.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : resolvedEntries.length > 0
        ? new Date(
            Math.min(
              ...resolvedEntries.map((e) => new Date(String(e.created_at ?? 0)).getTime()),
            ),
          ).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null;

  const gridLegend = (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-300 mt-3.5">
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


  const sendConexa = useCallback(async () => {
    const t = chatText.trim();
    if (!t || chatSending) return;
    setChatText("");
    setChatLog((l) => [...l, { role: "user", content: t }]);
    setChatSending(true);

    const connectedList: string[] = [];
    const toolsToCheck = ["GitHub", "Notion", "Stripe", "Lemon Squeezy", "Calendly", "Typeform"];
    toolsToCheck.forEach((tool) => {
      const val = localStorage.getItem(`oxe_connected_tool_${tool}`);
      if (val) {
        try {
          const parsedVal = JSON.parse(val);
          if (parsedVal) {
            if (tool === "GitHub") {
              connectedList.push(`GitHub (Repo: ${parsedVal.repo || "Unknown"}, Branch: ${parsedVal.branch || "main"})`);
            } else if (tool === "Notion") {
              connectedList.push(`Notion (Workspace: ${parsedVal.workspace || "Unknown"}, Database: ${parsedVal.database || "Execution Log"})`);
            } else if (tool === "Stripe") {
              connectedList.push(`Stripe (Account ID: ${parsedVal.accountId || "Unknown"}, Mode: ${parsedVal.mode || "live"})`);
            } else if (tool === "Lemon Squeezy") {
              connectedList.push(`Lemon Squeezy (Store ID: ${parsedVal.storeId || "Unknown"})`);
            } else if (tool === "Calendly") {
              connectedList.push(`Calendly (Link: ${parsedVal.username || "Unknown"})`);
            } else if (tool === "Typeform") {
              connectedList.push(`Typeform (Form ID: ${parsedVal.formId || "Unknown"})`);
            } else {
              connectedList.push(tool);
            }
          }
        } catch {
          connectedList.push(tool);
        }
      }
    });

    try {
      const res = await fetch("/api/conexa/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: t, connectedTools: connectedList }),
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
      <section id="oxe-dashboard-today" className="min-w-0 max-w-full text-[#EAEFF8] p-5 sm:p-7 space-y-4 pb-20 md:pb-20">
        {gapWarn ? (
          <div className="flex min-w-0 max-w-full items-start gap-2.5 rounded-[20px] border border-[#C2A478]/25 bg-[#C2A478]/10 px-[18px] py-3 text-[12.5px] text-ox-t2">
            <span className="mt-0.5 shrink-0 text-[#C2A478]" aria-hidden>
              ⓘ
            </span>
            <span className="min-w-0 flex-1 break-words">{gapWarn}</span>
          </div>
        ) : null}

        {loadError ? (
          <div className="rounded-[20px] border border-red-500/20 bg-red-500/5 p-5 flex flex-wrap items-center justify-between gap-4 transition-all duration-200">
            <div>
              <h3 className="text-sm font-semibold text-red-400">Connection Offline</h3>
              <p className="text-[12px] text-ox-t2 mt-0.5">{loadError}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadEntries()}
              className="rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white px-3.5 py-1.5 text-xs font-semibold transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : null}

        <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] p-5 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-300 mb-2.5">Days executed</p>
            <p className="text-[30px] font-bold tabular-nums leading-none tracking-tight" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
              {String(execCount)}
            </p>
            <p className="text-[11px] text-zinc-300 mt-1.5">{execCount} of 30 days</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] p-5 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-300 mb-2.5">Total submissions</p>
            <p className="text-[30px] font-bold tabular-nums leading-none" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
              {entries.length}
            </p>
            <p className="text-[11px] text-zinc-300 mt-1.5 tabular-nums">{String(user.break_count ?? 0)} breaks</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] p-5 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-300 mb-2.5">
              Directive completion
            </p>
            {day21Reached ? (
              <div className="space-y-1">
                <p className="text-[30px] font-bold leading-none" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                  {directiveStats ? `${directiveStats.completion_rate}%` : "—"}
                </p>
                <Link
                  href="/directive"
                  className="block text-[11.5px] font-medium text-[#0EA472] hover:underline pt-0.5"
                >
                  Open Daily Directive ➜
                </Link>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-[12.5px] text-ox-t2">
                <svg
                  className="w-[14px] h-[14px] shrink-0 text-ox-t2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                </svg>
                Unlocks at 21 days executed
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-300 mb-2.5">Signal score</p>
            {day21Reached ? (
              <Link
                href="/signal"
                className="text-[12.5px] font-medium text-[#7C64DC] hover:underline"
              >
                View Signal Score
              </Link>
            ) : (
              <p className="flex items-center gap-2 text-[12.5px] text-ox-t2">
                <svg
                  className="w-[14px] h-[14px] shrink-0 text-ox-t2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                </svg>
                Unlocks at 21 days executed
              </p>
            )}
          </div>
        </div>

        {entries[0]?.tier === "upload_unverified" ? (
          <p className="text-[12.5px] text-ox-t2 border border-white/[0.055] rounded-[20px] p-4 bg-[#1C1F2A]">
            File upload is on your record as unverified. Add a Verified Proof URL from the dashboard within 30 days for
            full Signal weight.
          </p>
        ) : null}

        <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] overflow-hidden">
          {entries[0]?.tier === "signup_execution" ? (
            <div className="px-[22px] py-3.5 border-b border-white/[0.055]">
              <p className="text-[12.5px] text-ox-t2 leading-snug">
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
                {beganDate ? <p className="text-[11.5px] text-zinc-300 mt-0.5">Began {beganDate}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11.5px]">
                <span className="text-ox-t2 tabular-nums">
                  Total: {entries.length} | Breaks: {String(user.break_count ?? 0)} |{" "}
                  <span className="text-[11.5px] font-medium text-[#0EA472]">FOR visible</span>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const ent = resolvedEntries.find((e) => Number(e.day_number) === day) as Record<string, string> | undefined;
                const isBreakDay = breakDaySet.has(day);
                let cls = "border border-white/[0.055] bg-white/[0.025]";
                if (ent?.tier === "verified_proof" || ent?.tier === "signup_execution" || ent?.tier === "declaration_validated" || ent?.tier === "submission_validated") {
                  cls = "bg-[#0EA472] border-[#0EA472] shadow-[0_2px_8px_rgba(14,164,114,0.3)]";
                } else if (ent?.tier === "declaration_pending") {
                  cls =
                    "bg-[#7C64DC] border-[#9B8CE8] shadow-[0_2px_10px_rgba(124,100,220,0.45)]";
                } else if (ent?.tier === "upload_unverified") {
                  cls =
                    "bg-[#C2A478] border-[#D4B896] shadow-[0_2px_10px_rgba(194,164,120,0.42)]";
                } else if (isBreakDay) {
                  cls = "bg-[#E24B4A] border-[#E24B4A] shadow-[0_2px_8px_rgba(226,75,74,0.3)]";
                }
                const isFutureSlot = !ent && !isBreakDay;

                let tooltip = `Day ${day}`;
                if (ent) {
                  if (ent.tier === "declaration_pending") {
                    tooltip = `Day ${day} · ○ DECLARATION · PENDING VALIDATION`;
                  } else {
                    tooltip = `Day ${day} · ${String(ent.tier).replace(/_/g, " ")}`;
                  }
                } else if (isBreakDay) {
                  tooltip = `Day ${day} · Break`;
                } else {
                  tooltip = `Day ${day} · Not yet.`;
                }

                return (
                  <button
                    type="button"
                    key={day}
                    className={`w-7 h-7 sm:w-[30px] sm:h-[30px] shrink-0 rounded-[6px] transition-transform hover:scale-105 ${cls} cursor-pointer ${
                      isFutureSlot ? "opacity-50" : ""
                    }`}
                    title={tooltip}
                    onClick={() => {
                      if (ent) {
                        setDayDetail(ent as unknown as Record<string, unknown>);
                      } else if (isBreakDay) {
                        setDayDetail({
                          day_number: day,
                          tier: "break",
                          message: "This gap is part of your record. Break marks are permanent.",
                        });
                      } else {
                        setDayDetail({
                          day_number: day,
                          tier: "future",
                          message: `Day ${day} · Not yet.`,
                        });
                      }
                    }}
                  />
                );
              })}
            </div>
            {gridLegend}
          </div>
        </div>

        {/* Daily Directive Panel */}
        {day21Reached && (
          <div className="rounded-[20px] border border-[rgba(124,100,220,0.35)] bg-[rgba(124,100,220,0.06)] shadow-[0_0_28px_rgba(124,100,220,0.12)] p-5 sm:p-[22px] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-0.5 text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                AI DIRECTIVE &middot; BASED ON BEHAVIORAL RECORD
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Daily window closes 23:59:50 UTC
              </span>
            </div>

            {activeDirective ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-white leading-relaxed">
                    &ldquo;{String(activeDirective.directive_text)}&rdquo;
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#DEF408] bg-[#DEF408]/10 px-2 rounded">
                      {String(activeDirective.behavioral_tag)} gap
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-white/5 px-2 rounded">
                      Day {String(activeDirective.day_number)}
                    </span>
                    {Boolean(activeDirective.is_maintenance) && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 rounded animate-pulse">
                        🛠 Maintenance Mode
                      </span>
                    )}
                  </div>
                </div>

                <form onSubmit={submitDashProof} className="space-y-3 pt-2 border-t border-white/[0.06]">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Submit Proof (Link or Description)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Enter proof link or write a brief description of what you did..."
                        value={dashProofUrl}
                        onChange={(e) => setDashProofUrl(e.target.value)}
                        disabled={dashSubmitting}
                        className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20 disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={dashSubmitting || !dashProofUrl.trim()}
                        className="rounded-xl bg-[#0EA472] hover:opacity-95 disabled:opacity-50 text-white font-semibold px-5 text-xs flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(14,164,114,0.2)] transition-all shrink-0"
                      >
                        {dashSubmitting ? (
                          <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          "Submit Proof"
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Attach Proof Files (Optional — up to 3 files, 5MB each)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept={ENTRY_UPLOAD_ACCEPT}
                      disabled={dashSubmitting}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs text-[#EAEFF8] file:mr-3 file:rounded-lg file:border-0 file:bg-white/[0.08] file:hover:bg-white/[0.12] file:px-3 file:py-1.5 file:text-white file:text-[11px] file:font-semibold file:cursor-pointer disabled:opacity-50"
                      onChange={(e) => {
                        const files = e.target.files
                          ? Array.from(e.target.files).slice(0, 3)
                          : [];
                        setDashProofFiles(files);
                        setDashError(null);
                      }}
                    />
                    {dashProofFiles.length > 0 && (
                      <ul className="text-[11px] text-zinc-400 space-y-1 pl-1 list-none">
                        {dashProofFiles.map((f, i) => (
                          <li key={`${f.name}-${i}`} className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">✓</span> {f.name} <span className="text-[10px] text-zinc-500">({Math.round(f.size / 1024)} KB)</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {dashError && (
                    <p className="text-[11px] font-medium text-red-400 bg-red-400/5 border border-red-400/20 px-2.5 py-1.5 rounded-lg">
                      ✕ {dashError}
                    </p>
                  )}
                </form>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-emerald-400 font-semibold">✓ Daily Directive completed and locked to record.</p>
                {dashSuccess && (
                  <p className="text-[11px] text-zinc-400 italic mt-2">
                    &ldquo;{dashSuccess}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chronological Entry Log */}
        <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] p-5 sm:p-[22px] space-y-4">
          <div>
            <h3 className="text-[14.5px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
              Execution Ledger
            </h3>
            <p className="text-[11.5px] text-ox-t3 mt-0.5">Chronological record of submissions and system-recorded gaps</p>
          </div>
          <div className="divide-y divide-white/[0.06] overflow-hidden">
            {logItems.length === 0 ? (
              <p className="text-sm text-ox-t3 py-4 text-center">No logs recorded yet.</p>
            ) : (
              logItems.map((item, index) => {
                const isBreak = item.type === "break";
                let desc = "";
                if (isBreak) {
                  desc = "No submission logged for this day. System-recorded break mark.";
                } else {
                  if (item.tier === "verified_proof" || item.tier === "declaration_validated" || item.tier === "submission_validated") {
                    desc = item.url || "Verified Proof URL submitted.";
                  } else if (item.tier === "declaration_pending") {
                    desc = item.declaration_text || "Declaration committed.";
                  } else if (item.tier === "upload_unverified") {
                    desc = `${item.context_sentence || "File uploaded."} (${item.upload_paths?.length || 1} file(s))`;
                  } else if (item.tier === "signup_execution") {
                    desc = item.declaration_text || "Signed up and activated Conexa.";
                  }
                }

                const dateStr = new Date(item.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <button
                    type="button"
                    key={index}
                    onClick={() => setDayDetail(item.raw)}
                    className="w-full text-left py-3 px-2.5 -mx-2.5 rounded-lg hover:bg-white/[0.02] flex items-center justify-between gap-4 transition-colors group"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-white font-mono">
                          {isBreak ? `Day ${item.day_number}` : `Entry #${String(item.entry_number).padStart(3, '0')}`}
                        </span>
                        {!isBreak && (
                          <span className="text-[11px] text-zinc-400 font-medium font-mono">
                            Day {item.day_number}
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isBreak ? "bg-red-500/10 text-red-400" :
                          item.category === "product" ? "bg-blue-500/10 text-blue-400" :
                          item.category === "distribution" ? "bg-violet-500/10 text-violet-400" :
                          "bg-amber-500/10 text-amber-400"
                        }`}>
                          {isBreak ? "BREAK" : item.category}
                        </span>
                      </div>
                      <p className="text-xs text-ox-t2 truncate pr-4">
                        {desc}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right space-y-0.5">
                        <p className="text-[11px] text-zinc-500">{dateStr}</p>
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider ${
                          isBreak ? "text-red-400" : "text-emerald-400"
                        }`}>
                          {isBreak ? "Break Mark" : String(item.tier).replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-red-400 text-xs font-semibold flex items-center gap-1 bg-red-400/5 border border-red-400/20 px-2 py-0.5 rounded">
                        🔒 LOCKED
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Referral System Panel */}
        {!user.day7_reached ? (
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] p-5 sm:p-[22px] overflow-hidden space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.055] pb-4">
              <div>
                <p className="text-[14.5px] font-semibold tracking-tight animate-pulse" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                  Referral System
                </p>
                <p className="text-[11.5px] text-ox-t3 mt-0.5">Invite early-stage founders to execute alongside you</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[13px] text-zinc-300">
                Your referral link is ready. We&apos;ll let you know when to use it.
              </p>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 max-w-md">
                <span className="text-xs text-ox-t2 select-all font-mono break-all flex-1">{referralLink}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(referralLink, "link")}
                  className="shrink-0 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  {copiedLink ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] p-5 sm:p-[22px] overflow-hidden space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.055] pb-4">
              <div>
                <p className="text-[14.5px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                  Referral Program
                </p>
                <p className="text-[11.5px] text-ox-t3 mt-0.5">Your referral link is active. Share it to unlock premium rewards.</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[rgba(14,164,114,0.35)] text-[#6ee7b7] bg-[rgba(14,164,114,0.12)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0EA472]" /> Active
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Your Referral Link</label>
                  <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5">
                    <span className="text-xs text-ox-t2 select-all font-mono break-all flex-1">{referralLink}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(referralLink, "link")}
                      className="shrink-0 rounded-lg bg-[#0EA472] hover:opacity-95 text-white px-3.5 py-1.5 text-xs font-semibold shadow-[0_2px_8px_rgba(14,164,114,0.2)] transition-all"
                    >
                      {copiedLink ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Quick Share Caption</label>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 text-xs text-ox-t2 leading-relaxed italic relative">
                    &ldquo;{prewrittenCaption}&rdquo;
                    <button
                      type="button"
                      onClick={() => copyToClipboard(prewrittenCaption, "caption")}
                      className="absolute bottom-2 right-2 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white px-2 py-1 text-[10px] font-semibold transition-colors"
                    >
                      {copiedCaption ? "Copied Caption!" : "Copy Caption"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <a
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(prewrittenCaption)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02]"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share on X
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02]"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                    </svg>
                    Share on LinkedIn
                  </a>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Reward Tiers Table</label>
                  <span className="text-xs text-zinc-400 tabular-nums">
                    <strong className="text-[#0EA472]">{onboardedCount}</strong> onboarded · <strong className="text-[#7C64DC]">{paidCount}</strong> paid
                  </span>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden text-xs">
                  <div className="grid grid-cols-[1.2fr_1fr] bg-white/[0.04] px-3.5 py-2.5 font-semibold text-white border-b border-white/[0.06]">
                    <div>Your Referrals</div>
                    <div>What you get</div>
                  </div>
                  <div className="divide-y divide-white/[0.06]">
                    {[
                      { label: "0 referrals", active: onboardedCount === 0, val: "$29/month full price", color: "" },
                      { label: "1 onboarded", active: onboardedCount >= 1, val: "25% off one month", color: "text-emerald-400 font-medium" },
                      { label: "3 onboarded", active: onboardedCount >= 3, val: "50% off one month", color: "text-emerald-400 font-medium" },
                      { label: "5 onboarded", active: onboardedCount >= 5, val: "1 month free", color: "text-emerald-400 font-medium" },
                      { label: "3 paid within 30 days", active: paidCount >= 3, val: "3 months free", color: "text-[#8B82F5] font-medium" },
                      { label: "5 paid within 30 days", active: paidCount >= 5, val: "50% off for 3 months", color: "text-[#8B82F5] font-medium" }
                    ].map((row, rIdx) => (
                      <div
                        key={rIdx}
                        className={`grid grid-cols-[1.2fr_1fr] px-3.5 py-2.5 transition-colors ${
                          row.active ? "bg-white/[0.05] font-semibold text-white" : "text-ox-t2"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {row.active && <span className="w-1.5 h-1.5 rounded-full bg-[#0EA472] shrink-0" />}
                          {row.label}
                        </div>
                        <div className={row.active ? row.color : "text-zinc-400"}>{row.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



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
                        <span className="text-ox-t3 tabular-nums ml-auto">
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
                <p className="text-[12.5px] text-ox-t2 py-4">No submissions yet.</p>
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
                    <span className="text-ox-t2 capitalize">{k}</span>
                    <span className="font-medium text-[#EAEFF8] tabular-nums">{Math.round((byCat[k] / totalCat) * 100)}%</span>
                  </div>
                  <div className="h-1 rounded-sm bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-sm ${k === "product" ? "bg-[#0EA472]" : k === "distribution" ? "bg-[#7C64DC]" : "bg-ox-t3"}`}
                      style={{ width: `${(byCat[k] / totalCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {report && visibleConexaTabs.length > 0 ? (
          <div className="rounded-[20px] border border-white/[0.055] bg-[#1C1F2A] text-[12.5px]">
            <div className="px-[22px] pt-4 pb-3 border-b border-white/[0.055]">
              <p className="text-[14.5px] font-semibold" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                Conexa Intelligence{" "}
                <span className="text-xs font-normal text-ox-t2">
                  · {visibleConexaTabs.length} tabs active from Day 1
                </span>
              </p>
            </div>
            <div className="sticky top-0 z-20 flex flex-nowrap items-end gap-0 overflow-x-auto scrollbar-none bg-[#1C1F2A]/98 backdrop-blur-[6px] px-[22px] pt-1 border-b border-white/[0.055]">
              {visibleConexaTabs.map(({ key, label }) => {
                const active = activeConexaKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setConexaTab(key)}
                    className={`relative shrink-0 min-h-[42px] px-[13px] py-2.5 text-xs whitespace-nowrap rounded-t-[12px] border border-transparent transition-colors ${
                      active
                        ? "z-[2] -mb-px font-semibold text-white border border-white/[0.1] border-b-0 border-l-[3px] border-l-[#2dd4bf] bg-[#1C1F2A] shadow-[inset_0_1px_0_0_rgba(45,212,191,0.22)]"
                        : "z-[1] mb-0 text-[#A8B0CC] hover:border-white/[0.06] hover:border-b-0 hover:bg-white/[0.04] hover:text-[#a7f3d0]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="p-5 sm:px-[22px] sm:pb-[22px]">
              <div className="rounded-[14px] border border-white/[0.055] bg-white/[0.025] px-[18px] py-4">
                <p className="text-[13.5px] font-semibold mb-2" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                  {CONEXA_TAB_ORDER.find((t) => t.key === activeConexaKey)?.label ?? ""}
                </p>
                <p className="text-[12.5px] text-ox-t2 leading-[1.75] whitespace-pre-wrap break-words">
                  {String(tabs[activeConexaKey] ?? "")}
                </p>
              </div>
            </div>
            {!day21Reached && (
              <div className="px-[22px] pb-[22px] pt-0">
                <button
                  type="button"
                  onClick={() => setConexaDrawerOpen(true)}
                  className="text-xs font-semibold text-[#7C64DC] hover:text-[#9B8CE8] hover:underline flex items-center gap-1.5 transition-colors"
                >
                  21 days executed unlocks 5 more ➜
                </button>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed z-50 pointer-events-auto left-4 inline-flex shrink-0 items-center gap-1 rounded-full bg-[#4F46E5] text-white px-3 py-2 text-[10px] sm:text-[11px] font-semibold leading-tight shadow-lg ring-1 ring-black/10 hover:opacity-95 bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:left-[calc(1.25rem+min(260px,22vw)+1.25rem)] lg:left-[calc(1.75rem+272px+1.5rem)] md:bottom-6"
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
              <p className="text-[13px] font-light text-ox-t2 leading-relaxed">
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
                      <span className="mt-1 block text-xs text-ox-t2 leading-snug">
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
                      <span className="mt-1 block text-xs text-ox-t2 leading-snug">
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
                      <span className="mt-1 block text-xs text-ox-t2 leading-snug">
                        File upload · PDF, DOCX, PNG, PPTX, XLSX · Max 10MB each · Up to 3 files
                      </span>
                    </span>
                  </div>
                </button>
              </div>

              {entryPath === "verified" ? (
                <div className="space-y-3">
                  <input
                    className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2.5 text-[#EAEFF8] placeholder:text-[var(--ox-placeholder)] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
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
                    <p className="text-xs text-ox-t2">Highest Signal weight when the URL validates.</p>
                  </div>
                  {upgradableEntries.length > 0 ? (
                    <div className="space-y-3 border-t border-white/[0.06] pt-4.5 mt-2">
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded bg-black/40 border-white/20 text-[#0EA472] focus:ring-0 focus:ring-offset-0"
                          style={{ accentColor: "#0EA472" }}
                          checked={relatesToPrevious}
                          onChange={(e) => {
                            setRelatesToPrevious(e.target.checked);
                            if (e.target.checked && upgradableEntries[0]) {
                              setSelectedUpgradeId(String(upgradableEntries[0].id));
                            } else {
                              setSelectedUpgradeId("");
                            }
                          }}
                        />
                        <span>Does this outcome relate to a previous declaration or upload?</span>
                      </label>
                      {relatesToPrevious && (
                        <div className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                          <label className="block text-[10px] font-semibold text-ox-t3 uppercase tracking-wider">
                            Select entry to upgrade
                          </label>
                          <select
                            className="w-full rounded-lg bg-[#181a25] border border-white/10 px-3 py-2.5 text-xs text-[#EAEFF8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
                            value={selectedUpgradeId}
                            onChange={(e) => setSelectedUpgradeId(e.target.value)}
                          >
                            {upgradableEntries.map((e) => {
                              const dateStr = new Date(String(e.created_at)).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              });
                              const text = String(e.declaration_text || "").trim();
                              const snippet = text ? `"${text.slice(0, 32)}..."` : "attachments only";
                              const labelText =
                                e.tier === "declaration_pending"
                                  ? `Day ${e.day_number} · Declaration: ${snippet} (${dateStr})`
                                  : `Day ${e.day_number} · File Upload: ${snippet} (${dateStr})`;
                              return (
                                <option key={String(e.id)} value={String(e.id)} className="bg-[#181a25]">
                                  {labelText}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {entryPath === "declaration" ? (
                <div className="space-y-3">
                  <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-ox-t2 leading-relaxed">
                    What are you building today? What will prove it&apos;s done? · 30–140 chars
                  </label>
                  <div className="relative">
                    <textarea
                      className={`w-full min-h-[128px] rounded-lg bg-black/30 border px-3 py-2 pr-3 pb-9 text-[#EAEFF8] placeholder:text-[var(--ox-placeholder)] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 ${
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
                    <span className="absolute bottom-2 right-3 text-xs tabular-nums text-ox-t2">
                      {decl.length}/140
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/35 bg-amber-950/40 px-3 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-200 whitespace-nowrap">
                      Declaration · Pending
                    </span>
                    <p className="text-xs text-ox-t2">
                      Upgrade within 30 days with a Verified Proof URL.
                    </p>
                  </div>
                  <label className="block text-xs text-ox-t2">
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
                    <ul className="text-xs text-ox-t2 space-y-1 list-disc list-inside">
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
                  <span className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-ox-t2">
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
                    <ul className="text-xs text-ox-t2 space-y-1 list-disc list-inside">
                      {uploadProofFiles.map((f, i) => (
                        <li key={`${f.name}-${i}`}>
                          {f.name} ({Math.round(f.size / 1024)} KB)
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-ox-t2 leading-relaxed">
                    What was made? · 30–140 chars required
                  </label>
                  <div className="relative">
                    <textarea
                      className={`w-full min-h-[100px] rounded-lg bg-black/30 border px-3 py-2 pb-9 text-[#EAEFF8] placeholder:text-[var(--ox-placeholder)] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 ${
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
                    <span className="absolute bottom-2 right-3 text-xs tabular-nums text-ox-t2">
                      {uploadContext.length}/140
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-violet-500/35 bg-violet-950/35 px-3 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-200 whitespace-nowrap">
                      Submission · Unverified
                    </span>
                    <p className="text-xs text-ox-t2">
                      Link a Verified Proof within 30 days for full Signal weight.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <span className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-ox-t2">
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
                          : "border-white/20 text-ox-t2 hover:border-[var(--ac)]/45"
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
                    body = {
                      path: "verified",
                      url: proofUrl.trim(),
                      category: cat,
                      ...(relatesToPrevious && selectedUpgradeId ? { upgraded_from_id: selectedUpgradeId } : {}),
                    };
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
                  let res: Response;
                  try {
                    res = await fetch("/api/entries", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "same-origin",
                      body: JSON.stringify(body),
                    });
                  } catch {
                    setSubmitError("API timeout or network offline. Could not submit proof.");
                    return;
                  }
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
                className="text-sm text-ox-t2 hover:text-[#EAEFF8]"
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
          <div className="relative bg-[var(--sur)] rounded-2xl w-full max-w-md p-6 shadow-xl text-sm space-y-2 text-left">
            <p className="font-semibold text-white">Day {String(dayDetail.day_number)}</p>
            {dayDetail.tier === "break" || dayDetail.tier === "future" ? (
              <p className="text-[var(--t2)]">{String(dayDetail.message)}</p>
            ) : (
              <>
                <p className="text-[var(--t2)] capitalize">
                  {dayDetail.tier === "declaration_pending"
                    ? "○ DECLARATION · PENDING VALIDATION"
                    : dayDetail.tier === "declaration_validated"
                      ? "Verified Proof (Upgraded Declaration) · Locked · Immutable"
                      : dayDetail.tier === "submission_validated"
                        ? "Verified Proof (Upgraded Upload) · Locked · Immutable"
                        : String(dayDetail.tier).replace(/_/g, " ") + " · Locked · Immutable"}
                </p>
                <p className="text-[var(--t2)]">Category: {String(dayDetail.category)}</p>
                {dayDetail.url ? (
                  <a
                    href={String(dayDetail.url)}
                    className="text-[var(--p)] break-all underline block mt-1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {String(dayDetail.url)}
                  </a>
                ) : null}
                {dayDetail.declaration_text ? (
                  <p className="text-[var(--t2)] mt-2 italic bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg">
                    &ldquo;{String(dayDetail.declaration_text)}&rdquo;
                  </p>
                ) : null}
                {Array.isArray(dayDetail.upload_paths) && (dayDetail.upload_paths as string[]).length > 0 ? (
                  <p className="text-[var(--t2)] text-xs mt-2">
                    Attachments: {(dayDetail.upload_paths as string[]).length} file(s) on record (private storage).
                  </p>
                ) : null}
              </>
            )}
            <div className="pt-2">
              <button
                type="button"
                className="mt-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white px-4 py-2 text-xs font-semibold transition-colors"
                onClick={() => setDayDetail(null)}
              >
                Close
              </button>
            </div>
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
                className="text-[12px] text-ox-t2 hover:text-[#EAEFF8]"
                onClick={() => setChatOpen(false)}
              >
                Close
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {chatLog.length === 0 ? (
                <p className="text-[13px] text-ox-t2 leading-relaxed">
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
                  <div className="rounded-[12px] px-3 py-2.5 border border-white/[0.06] bg-white/[0.04] text-ox-t2 text-[13px]">
                    Thinking…
                  </div>
                </div>
              ) : null}
            </div>
            <div className="p-3 border-t border-white/[0.055] flex gap-2 bg-[#1C1F2A]">
              <input
                className="flex-1 min-w-0 rounded-[10px] border border-[rgba(255,255,255,0.055)] bg-[#1C1F2A] px-3 py-2.5 text-sm text-[#EAEFF8] placeholder:text-[var(--ox-placeholder)] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
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
      {/* Conexa Locked Tabs Slide-out Drawer */}
      {conexaDrawerOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end pointer-events-auto">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-pointer"
            onClick={() => setConexaDrawerOpen(false)}
          />
          {/* Drawer container */}
          <div className="relative w-full max-w-[480px] h-full bg-[#0d0f1a] border-l border-white/[0.1] shadow-2xl p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto text-[#EAEFF8] animate-[slideIn_0.3s_ease-out]">
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}</style>
            
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7C64DC]">
                  Conexa Intelligence
                </p>
                <h2 className="text-xl font-extrabold tracking-tight mt-1" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                  Locked Conexa Insights
                </h2>
              </div>
              <button
                type="button"
                className="text-zinc-400 hover:text-white rounded-full bg-white/[0.04] p-1.5 transition-colors"
                onClick={() => setConexaDrawerOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="rounded-xl border border-[rgba(124,100,220,0.35)] bg-[rgba(124,100,220,0.06)] p-4 text-xs leading-relaxed text-zinc-300">
              <strong className="text-white block mb-1">These 5 tabs unlock at 21 days executed.</strong>
              They read your behaviour, not your declarations. The drawer is read-only at MVP, showing what 21 days executed will reveal.
            </div>

            <div className="space-y-6">
              {[
                {
                  tab: "Tab 7",
                  title: "Where Your Time Actually Went",
                  desc: "21-day category breakdown vs your stated focus on Day 1."
                },
                {
                  tab: "Tab 8",
                  title: "What You Said You'd Do — And Did",
                  desc: "Every declaration-to-proof arc. The times you committed and followed through."
                },
                {
                  tab: "Tab 9",
                  title: "Your Avoidance Pattern, Confirmed",
                  desc: "Day 1 stated avoidance vs 21 days of actual submissions. Confirmed / Contradicted / Expanded."
                },
                {
                  tab: "Tab 10",
                  title: "Your Execution Signature",
                  desc: "Your behavioural type from the record. One of four named patterns."
                },
                {
                  tab: "Tab 11",
                  title: "The Gap That Will Kill This",
                  desc: "One thing. The most dangerous pattern in 21 days. No softening."
                }
              ].map((item, index) => (
                <div key={index} className="rounded-xl border border-white/[0.055] bg-white/[0.02] p-4 flex gap-3 animate-[fadeIn_0.5s_ease-out]">
                  <div className="w-8 h-8 rounded-lg shrink-0 bg-[#7C64DC]/15 border border-[#7C64DC]/30 text-[#8B82F5] text-[10px] font-bold flex items-center justify-center">
                    {item.tab}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white tracking-tight" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                      {item.title}
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setConexaDrawerOpen(false)}
              className="mt-auto w-full min-h-[44px] rounded-xl text-xs font-semibold border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white transition-all"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DashboardMain() {
  return (
    <Suspense fallback={null}>
      <DashboardMainInner />
    </Suspense>
  );
}

export default function DashboardPage() {
  const [gateKey, setGateKey] = useState(0);

  return (
    <AuthenticatedShell
      refreshKey={gateKey}
      fullscreenBlock={(u) =>
        Boolean(u.day21_reached) && !u.day21_unlocked ? (
          <Day21Gate user={u} onUnlock={() => setGateKey((k) => k + 1)} />
        ) : null
      }
    >
      <DashboardMain />
    </AuthenticatedShell>
  );
}
