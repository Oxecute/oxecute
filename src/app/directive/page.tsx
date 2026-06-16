"use client";

import { AuthenticatedShell, useShellUser } from "@/components/app/AuthenticatedShell";
import { RECORD_PAGE_SUBTITLE_CLASS } from "@/components/app/RecordPageHeader";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ENTRY_UPLOAD_ACCEPT, uploadEntryDeclarationFiles } from "@/lib/entry-uploads";
import { FaTools, FaCheck, FaTimes, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

type DirectiveItem = {
  id: string;
  day_number: number;
  directive_text: string;
  behavioral_tag: string;
  status: "open" | "completed" | "missed";
  proof_url: string | null;
  is_maintenance: boolean;
  created_at: string;
};

type DirectiveStats = {
  issued: number;
  completed: number;
  missed: number;
  completion_rate: number;
};

function DirectiveContent() {
  const user = useShellUser();
  const day21 = Boolean(user.day21_reached);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<DirectiveItem | null>(null);
  const [history, setHistory] = useState<DirectiveItem[]>([]);
  const [stats, setStats] = useState<DirectiveStats | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successAck, setSuccessAck] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).slice(0, 3);
      setProofFiles(files);
      setError(null);
    }
  };

  const loadDirectives = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/directives");
      if (res.ok) {
        const data = await res.json();
        setActive(data.active);
        setHistory(data.history || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load directives:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (day21) {
      void loadDirectives();
    } else {
      setLoading(false);
    }
  }, [day21]);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !proofUrl.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccessAck(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Your session expired. Sign in again.");
      }

      let upload_paths: string[] | undefined;
      if (proofFiles.length > 0) {
        try {
          upload_paths = await uploadEntryDeclarationFiles(
            supabase,
            session.user.id,
            proofFiles,
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
          directive_id: active.id,
          proof_url: proofUrl.trim(),
          upload_paths,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit proof");
      }

      setSuccessAck(data.acknowledgment || "Proof successfully verified and committed to ledger.");
      setProofUrl("");
      setProofFiles([]);
      void loadDirectives();
    } catch (err) {
      const eMsg = err instanceof Error ? err.message : "Validation failed.";
      setError(eMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="text-[#EAEFF8] p-5 sm:p-7 flex items-center justify-center min-h-[300px]">
        <span className="inline-block h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </section>
    );
  }

  if (day21) {
    return (
      <section className="text-[#EAEFF8] p-5 sm:p-7 space-y-8 max-w-4xl mx-auto pb-20">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
            Daily Directive
          </h1>
          <p className={RECORD_PAGE_SUBTITLE_CLASS}>
            One move. Every day. No guessing. Conexa maps your avoidance patterns and targets your operational gaps.
          </p>
        </div>

        {/* Active Directive Display */}
        {active ? (
          <div className="rounded-2xl border border-[rgba(124,100,220,0.35)] bg-[rgba(124,100,220,0.06)] shadow-[0_0_28px_rgba(124,100,220,0.12)] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-0.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                AI DIRECTIVE &middot; BASED ON BEHAVIORAL RECORD
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Closes today 23:59:50 UTC
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white leading-relaxed">
                &ldquo;{active.directive_text}&rdquo;
              </h3>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#DEF408] bg-[#DEF408]/10 px-2.5 py-0.5 rounded">
                  {active.behavioral_tag} gap
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded">
                  Day {active.day_number}
                </span>
                {active.is_maintenance && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded animate-pulse">
                    <FaTools className="w-3 h-3" /> Maintenance Mode
                  </span>
                )}
              </div>
            </div>

            {/* Proof Submission Form */}
            <form onSubmit={handleSubmitProof} className="space-y-4 pt-3 border-t border-white/[0.06]">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Submit Proof (Link or Description)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter proof link or write a brief description of what you did..."
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.1] px-4 py-3 text-sm text-white outline-none focus:border-white/20 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !proofUrl.trim()}
                    className="rounded-xl bg-[#0EA472] hover:opacity-95 disabled:opacity-50 text-white font-semibold px-6 text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(14,164,114,0.25)] transition-all shrink-0"
                  >
                    {submitting ? (
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      "Lock Proof"
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Attach Proof Files (Optional — up to 3 files, 5MB each)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("proof-file-input")?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 py-6 px-4 flex flex-col items-center justify-center text-center space-y-2 select-none group ${
                    isDragOver
                      ? "border-indigo-400 bg-indigo-500/10 scale-[1.01] shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  } ${submitting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <input
                    id="proof-file-input"
                    type="file"
                    multiple
                    accept={ENTRY_UPLOAD_ACCEPT}
                    disabled={submitting}
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files
                        ? Array.from(e.target.files).slice(0, 3)
                        : [];
                      setProofFiles(files);
                      setError(null);
                    }}
                  />
                  
                  <div className={`p-2.5 rounded-full transition-all duration-300 ${
                    isDragOver ? "bg-indigo-500/20 text-indigo-400" : "bg-white/[0.04] text-zinc-400 group-hover:text-zinc-300"
                  }`}>
                    <svg
                      className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#EAEFF8]">
                      {isDragOver ? "Drop to upload files" : "Drag & drop files here, or click to browse"}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Supports JPG, PNG, WebP, GIF, or PDF (Max 3 files, 5MB each)
                    </p>
                  </div>
                </div>

                {proofFiles.length > 0 && (
                  <ul className="text-xs text-zinc-400 space-y-1.5 pl-1 pt-1 list-none">
                    {proofFiles.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-1.5 transition-all hover:bg-white/[0.04]">
                        <div className="flex items-center gap-2 min-w-0">
                          <FaCheck className="text-emerald-400 shrink-0 w-3.5 h-3.5" />
                          <span className="truncate font-medium text-zinc-300 text-[11.5px]">{f.name}</span>
                          <span className="text-[9.5px] text-zinc-500 shrink-0 font-mono">({Math.round(f.size / 1024)} KB)</span>
                        </div>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProofFiles(prev => prev.filter((_, idx) => idx !== i));
                          }}
                          className="text-zinc-500 hover:text-red-400 transition-colors px-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && (
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/5 border border-red-400/20 px-3 py-2 rounded-lg">
                  <FaTimes className="w-3.5 h-3.5" /> {error}
                </p>
              )}
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col items-center text-center space-y-3">
            <FaCheckCircle className="text-2xl text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-emerald-400">Directive Complete</h3>
              <p className="text-xs text-ox-t2 mt-1 max-w-sm">
                You have locked your proof for today&apos;s Conexa directive. Your progress has been committed to the execution ledger.
              </p>
            </div>
            {successAck && (
              <p className="text-xs text-zinc-400 italic pt-2 border-t border-white/5 w-full">
                &ldquo;{successAck}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Stats Panel */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/[0.055] bg-[#1C1F2A] p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Directives Issued</p>
              <p className="text-2xl font-extrabold mt-1 text-white font-mono">{stats.issued}</p>
            </div>
            <div className="rounded-xl border border-white/[0.055] bg-[#1C1F2A] p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Completed</p>
              <p className="text-2xl font-extrabold mt-1 text-emerald-400 font-mono">{stats.completed}</p>
            </div>
            <div className="rounded-xl border border-white/[0.055] bg-[#1C1F2A] p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Missed</p>
              <p className="text-2xl font-extrabold mt-1 text-red-400 font-mono">{stats.missed}</p>
            </div>
            <div className="rounded-xl border border-white/[0.055] bg-[#1C1F2A] p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Completion Rate</p>
              <p className={`text-2xl font-extrabold mt-1 font-mono ${
                stats.completion_rate < 60 ? "text-red-400" : "text-white"
              }`}>
                {stats.completion_rate}%
              </p>
            </div>
          </div>
        )}

        {/* Warning Indicator */}
        {stats && stats.completion_rate < 60 && stats.issued > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
            <FaExclamationTriangle className="text-red-400 shrink-0 w-4 h-4" />
            <p>
              Your directive completion rate is currently <span className="font-bold text-white">{stats.completion_rate}%</span>. Sustained rates below 60% will affect your Signal Score and risk visibility suspension at Day 21/60.
            </p>
          </div>
        )}

        {/* Directive History Panel */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
            Directive History
          </h3>
          <div className="rounded-2xl border border-white/[0.055] bg-[#1C1F2A] overflow-hidden divide-y divide-white/[0.06]">
            {history.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No previous directives recorded.</p>
            ) : (
              history.map((dir) => (
                <div key={dir.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-zinc-400 font-mono">
                        Day {dir.day_number}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                        {dir.behavioral_tag}
                      </span>
                      {dir.is_maintenance && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                          <FaTools className="w-2.5 h-2.5" /> maintenance
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#EAEFF8] leading-relaxed break-words">
                      &ldquo;{dir.directive_text}&rdquo;
                    </p>
                    {dir.proof_url && (
                      <p className="text-xs text-zinc-500 truncate">
                        Proof: <a href={dir.proof_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{dir.proof_url}</a>
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      dir.status === "completed" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {dir.status === "completed" ? (
                        <>
                          <FaCheck className="w-2.5 h-2.5" /> Done
                        </>
                      ) : (
                        <>
                          <FaTimes className="w-2.5 h-2.5" /> Missed
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="text-[#EAEFF8] p-5 sm:p-7 space-y-6">
      <p className={RECORD_PAGE_SUBTITLE_CLASS}>
        One move. Every day. No guessing. Activates after 21 days of execution. Conexa already knows what you&apos;re avoiding.
      </p>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14161f]">
        <div className="relative h-[min(58vh,520px)] w-full overflow-hidden">
          <img
            src="/brand/daily-directive-lock-preview.png"
            alt=""
            className="absolute left-1/2 top-1/2 min-h-[115%] min-w-[115%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-top blur-lg scale-100"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[#0a0c12]/45" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center px-6 py-12">
            <p className="text-center text-[15px] sm:text-base font-normal text-[#EAEFF8] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Unlocks at 21 days executed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DirectivePage() {
  return (
    <AuthenticatedShell>
      <DirectiveContent />
    </AuthenticatedShell>
  );
}
