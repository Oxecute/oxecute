"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardNavLogo } from "./DashboardNav";

/** Dashboard L-shell header (cols 2–3): title + Today / UTC / Submit. Logo lives in grid col 1. */
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

  const openSubmit = () => {
    if (pathname === "/dashboard") {
      window.dispatchEvent(new Event("oxe:open-submit-entry"));
    } else {
      router.push("/dashboard?submit=1");
    }
  };

  const scrollToday = () => {
    document.getElementById("oxe-dashboard-today")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="flex w-full min-w-0 flex-col bg-[#0B0F14]">
      <div className="flex items-center border-b border-[#1F2430] px-5 py-3 md:hidden">
        <DashboardNavLogo />
      </div>
      <div className="flex min-h-0 min-w-0 flex-nowrap items-center justify-between gap-4 border-b border-[#1F2430] px-6 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1
            className="m-0 p-0 text-[17px] font-extrabold leading-tight tracking-[-0.02em] text-[#FFFFFF] sm:text-[18px]"
            style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
          >
            Founder Operating Record
          </h1>
          <p className="m-0 text-[11px] font-medium leading-snug text-[#635BFF] sm:text-[12px]">Commit</p>
        </div>

        <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={scrollToday}
            className="inline-flex items-center rounded-full border border-[#1F2430] bg-transparent px-2.5 py-1.5 text-[10px] font-semibold text-[#FFFFFF] hover:bg-white/[0.04] sm:px-3 sm:text-[11px]"
          >
            Today
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1F2430] bg-transparent px-2.5 py-1.5 text-[10px] font-medium tabular-nums text-[#8B93A7] sm:px-3 sm:text-[11px]">
            <svg className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            {utcClock}
          </span>
          <button
            type="button"
            onClick={openSubmit}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#16C784] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_2px_12px_rgba(22,199,132,0.25)] hover:opacity-95 sm:px-4 sm:text-[12px]"
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
