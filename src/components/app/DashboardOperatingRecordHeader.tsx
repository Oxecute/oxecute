"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardNavLogo } from "./DashboardNav";
import { formatCountdown, getUtcWindowRemainingParts } from "./utc-countdown";

const pillBorder =
  "inline-flex items-center gap-1.5 rounded-full border border-[#1F2430] bg-transparent px-2.5 py-1.5 text-[10px] font-medium tabular-nums text-[#8B93A7] sm:px-3 sm:text-[11px]";

/** Dashboard L-shell header (cols 2–3): title + UTC / Window / Submit. Logo lives in grid col 1. */
export function DashboardOperatingRecordHeader() {
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

  const iconSm = "h-3 w-3 shrink-0 text-[#8B93A7] sm:h-3.5 sm:w-3.5";

  return (
    <header className="flex w-full min-w-0 flex-col bg-[#0B0F14]">
      <div className="flex items-center border-b border-[#1F2430] px-5 py-3 md:hidden">
        <DashboardNavLogo />
      </div>
      <div
        className={
          "flex min-h-0 min-w-0 flex-col gap-3 border-b border-[#1F2430] px-4 py-4 " +
          "sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
        }
      >
        <div className="min-w-0 w-full shrink-0 sm:w-auto sm:max-w-[min(100%,42rem)] sm:flex-1">
          <h1
            className="m-0 max-w-full break-words p-0 text-[16px] font-extrabold leading-snug tracking-[-0.02em] text-[#FFFFFF] sm:text-[17px] md:text-[18px]"
            style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
          >
            Founder Operating Record
          </h1>
          <p className="m-0 mt-1 text-[11px] font-medium leading-snug text-[#635BFF] sm:text-[12px]">Commit</p>
        </div>

        <div
          className={
            "flex w-full min-w-0 flex-wrap content-center items-center gap-2 " +
            "sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2.5"
          }
        >
          <span className={`${pillBorder} shrink-0`}>
            <svg className={iconSm} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            {utcClock}
          </span>
          <span
            className={`${pillBorder} shrink-0`}
            title="Time remaining until 23:59:59 UTC (submission window)"
          >
            <svg className={iconSm} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium normal-case tracking-normal text-[#8B93A7]">Window</span>
            {windowLeft}
          </span>
          <button
            type="button"
            onClick={openSubmit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#16C784] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_2px_12px_rgba(22,199,132,0.25)] hover:opacity-95 sm:px-4 sm:text-[12px]"
          >
            <span className="text-sm font-bold leading-none" aria-hidden>
              +
            </span>
            Submit Entry
          </button>
        </div>
      </div>
    </header>
  );
}
