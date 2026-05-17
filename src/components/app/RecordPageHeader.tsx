"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { formatCountdown, getUtcWindowRemainingParts } from "./utc-countdown";

/** Subtitle under page title (Signal Score, Daily Directive, etc.) */
export const RECORD_PAGE_SUBTITLE_CLASS =
  "text-[15px] sm:text-[17px] text-[#EAEFF8] leading-relaxed max-w-2xl font-normal [text-wrap:pretty]";

/**
 * Primary page chrome: UTC clock, window countdown, optional actions, and Submit Entry.
 */
export function RecordPageHeader({
  title,
  subtitle,
  extraActions,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  extraActions?: ReactNode;
  className?: string;
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

  return (
    <div className={`flex flex-col gap-2 border-b border-white/[0.055] pb-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 shrink">{title}</div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 shrink-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#1C1F2A] px-3.5 py-1.5 text-[12px] font-medium text-[#A8B0CC] tabular-nums ring-1 ring-white/[0.06]">
            <svg className="w-[14px] h-[14px] shrink-0 text-ox-t2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            {utcClock}
          </span>
          <span
            className="inline-flex items-center gap-2 rounded-full bg-[#1C1F2A] px-3.5 py-1.5 text-[12px] font-medium text-[#A8B0CC] tabular-nums ring-1 ring-white/[0.06]"
            title="Time remaining until 23:59:59 UTC (submission window)"
          >
            <svg className="w-[14px] h-[14px] shrink-0 text-ox-t2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-ox-t2 font-medium normal-case tracking-normal">Window</span>
            {windowLeft}
          </span>
          {extraActions}
          <button
            type="button"
            onClick={openSubmit}
            className="inline-flex items-center gap-2 rounded-full bg-[#0EA472] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(14,164,114,0.28)] hover:opacity-95"
          >
            <span className="text-base leading-none font-bold" aria-hidden>
              +
            </span>
            Submit Entry
          </button>
        </div>
      </div>
      {subtitle != null ? <div className="min-w-0 max-w-2xl">{subtitle}</div> : null}
    </div>
  );
}
