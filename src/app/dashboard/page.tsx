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

  return (
    <>
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Founder Operating Record</h1>
          <p className="text-sm text-[var(--t2)] mt-1">
            Close the window before 23:59:59 UTC. Every verified proof compounds your signal.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)]">
            <p className="text-xs text-[var(--t3)]">Days executed</p>
            <p className="text-3xl font-bold">{String(user.execution_count)}</p>
          </div>
          <div className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)]">
            <p className="text-xs text-[var(--t3)]">Submissions / breaks</p>
            <p className="text-3xl font-bold">
              {entries.length} · {String(user.break_count)}
            </p>
          </div>
        </div>

        {gapWarn ? (
          <p className="text-sm rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100 p-3">
            {gapWarn}
          </p>
        ) : null}

        <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4">
          <p className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wide mb-3">
            Work mix (all submissions)
          </p>
          {(["product", "distribution", "ops"] as const).map((k) => (
            <div key={k} className="mb-2 last:mb-0">
              <div className="flex justify-between text-xs text-[var(--t2)] mb-1">
                <span className="capitalize">{k}</span>
                <span>
                  {byCat[k]} · {Math.round((byCat[k] / totalCat) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--sur2)] overflow-hidden">
                <div
                  className="h-full bg-[var(--p)] rounded-full transition-all"
                  style={{ width: `${(byCat[k] / totalCat) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {entries[0]?.tier === "signup_execution" && (
          <p className="text-sm text-[var(--t2)] border border-[var(--bdr)] rounded-lg p-3 bg-[var(--sur)]">
            Signing up was your Day 1 record. Submit your first verified proof today to build from here.
          </p>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setDeclFiles([]);
              setModalOpen(true);
            }}
            className="rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold px-6 py-2"
          >
            + Submit today&apos;s entry →
          </button>
          <a
            href={`/${user.username}`}
            className="text-sm text-[var(--p)] underline-offset-2 hover:underline"
          >
            View public profile
          </a>
        </div>

        {recent.length > 0 && (
          <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4">
            <p className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wide mb-3">
              Recent submissions
            </p>
            <ul className="space-y-2 text-sm">
              {recent.map((e) => (
                <li
                  key={String(e.id)}
                  className="border-b border-[var(--bdr)]/60 pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-between">
                    <span className="text-[var(--t2)]">
                      Day {String(e.day_number)} · {String(e.category)} ·{" "}
                      {String(e.tier).replace(/_/g, " ")}
                    </span>
                    <span className="text-[var(--t3)] text-xs tabular-nums">
                      {new Date(String(e.created_at)).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[var(--t1)] text-sm mt-1 leading-snug">
                    {submissionBrief(
                      e as {
                        tier?: string | null;
                        url?: string | null;
                        declaration_text?: string | null;
                      },
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-xs text-[var(--t3)] mb-2">30-day heatmap · tap a day</p>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1;
              const ent = entries.find((e) => Number(e.day_number) === day) as Record<
                string,
                string
              > | undefined;
              let cls = "bg-[var(--sur2)] opacity-20";
              if (ent?.tier === "verified_proof") cls = "bg-[rgba(1,2,97,0.75)]";
              if (ent?.tier === "declaration_pending") cls = "bg-[rgba(124,58,237,0.75)]";
              if (ent?.tier === "signup_execution") cls = "bg-[rgba(34,197,94,0.4)]";
              return (
                <button
                  type="button"
                  key={day}
                  className={`aspect-square rounded ${cls} ${ent ? "cursor-pointer hover:ring-2 ring-[var(--ac)]" : "cursor-default"}`}
                  title={`Day ${day}`}
                  onClick={() => (ent ? setDayDetail(ent as unknown as Record<string, unknown>) : undefined)}
                />
              );
            })}
          </div>
        </div>

        {report && (
          <div className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)] text-sm space-y-2">
            <p className="font-semibold">Conexa · Day 1 report</p>
            <p className="text-[var(--t2)]">{String(report.personal_insight ?? "")}</p>
            {Object.entries(tabs).map(([k, v]) => (
              <details key={k} className="border-t border-[var(--bdr)] pt-2">
                <summary className="cursor-pointer">{k}</summary>
                <p className="text-[var(--t2)] mt-2">{v}</p>
              </details>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-20">
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
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-4">
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

      <button
        type="button"
        className="fixed bottom-6 left-6 w-12 h-12 rounded-full bg-[var(--p)] text-[var(--fw)] shadow-lg z-10"
        onClick={() => setChatOpen(true)}
      >
        ◎
      </button>

      {chatOpen && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-4">
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
      showRightRail
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
