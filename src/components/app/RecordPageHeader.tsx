"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { formatCountdown, getUtcWindowRemainingParts } from "./utc-countdown";

/** Subtitle under page title (Signal Score, Daily Directive, etc.) */
export const RECORD_PAGE_SUBTITLE_CLASS =
  "text-[15px] sm:text-[17px] text-[#EAEFF8] leading-relaxed max-w-2xl font-normal [text-wrap:pretty]";

/**
 * Primary page chrome: UTC clock, window countdown, optional actions, and Submit Entry.
 * @param compact Tighter layout for fixed-height shell band (e.g. 72px row with subtitle).
 */
export function RecordPageHeader({
  title,
  subtitle,
  extraActions,
  className = "",
  compact = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  extraActions?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  void tick;
  const utcClock = `${new Date().toISOString().slice(11, 19)} UTC`;
  const windowLeft = formatCountdown(getUtcWindowRemainingParts());

  const openSubmit = () => {
    if (pathname === "/dashboard") {
      window.dispatchEvent(new Event("oxe:open-submit-entry"));
    } else {
      router.push("/dashboard?submit=1");
    }
  };

  const pad = compact ? "pb-0" : "pb-4 sm:pb-5";
  const gap = compact ? "gap-1" : "gap-2";
  const rowGap = compact ? "gap-x-2 gap-y-1" : "gap-x-3 gap-y-2";
  const pill =
    "inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] font-medium text-[var(--t3)] tabular-nums ring-1 ring-white/[0.05] " +
    (compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]");
  const iconS = compact ? "w-3 h-3" : "w-[14px] h-[14px]";

  return (
    <div className={`flex flex-col min-h-0 min-w-0 ${gap} border-b border-white/[0.04] ${pad} ${className}`}>
      <div className={`flex flex-wrap items-center justify-between ${rowGap}`}>
        <div className="min-w-0 shrink">{title}</div>
        <div className={`flex flex-wrap items-center justify-end shrink-0 ${compact ? "gap-1.5" : "gap-2 sm:gap-2.5"}`}>
          <span className={pill}>
            <svg className={`${iconS} shrink-0 text-ox-t2`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            {utcClock}
          </span>
          <span className={pill} title="Time remaining until 23:59:59 UTC (submission window)">
            <svg className={`${iconS} shrink-0 text-ox-t2`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-ox-t2 font-medium normal-case tracking-normal">Window</span>
            {windowLeft}
          </span>
          {extraActions}
          <button
            type="button"
            onClick={openSubmit}
            className={
              compact
                ? "inline-flex items-center gap-1.5 rounded-full bg-[#0EA472] px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_2px_12px_rgba(14,164,114,0.25)] hover:opacity-95"
                : "inline-flex items-center gap-2 rounded-full bg-[#0EA472] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(14,164,114,0.28)] hover:opacity-95"
            }
          >
            <span className={`leading-none font-bold ${compact ? "text-sm" : "text-base"}`} aria-hidden>
              +
            </span>
            Submit Entry
          </button>
        </div>
      </div>
      {subtitle != null ? (
        <div className={`min-w-0 max-w-2xl ${compact ? "leading-tight" : ""}`}>{subtitle}</div>
      ) : null}
    </div>
  );
}
