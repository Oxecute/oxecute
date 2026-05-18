"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { COMING_SOON_PILL_CLASS } from "./dashboard-nav-config";
import { formatCountdown, getUtcWindowRemainingParts } from "./utc-countdown";

const pillBorder =
  "inline-flex items-center gap-1.5 rounded-full border border-[#1F2430] bg-transparent px-2.5 py-1.5 text-[10px] font-medium tabular-nums text-[#8B93A7] sm:px-3 sm:text-[11px]";

const h1Shell =
  "m-0 max-w-full break-words p-0 text-[16px] font-extrabold leading-snug tracking-[-0.02em] text-[#FFFFFF] sm:text-[17px] md:text-[18px]";

const h1Font = { fontFamily: "var(--font-urbanist), Urbanist, sans-serif" } as const;

function shellTitle(text: string) {
  return (
    <h1 className={h1Shell} style={h1Font}>
      {text}
    </h1>
  );
}

/** Laptop (`md+`): same inner row as pre-split header (logo row removed — logo band is in AppShell grid). */
function RecordLShellHeaderDesktop({
  title,
  subtitle,
  extraActions,
  utcClock,
  windowLeft,
  openSubmit,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  extraActions?: ReactNode;
  utcClock: string;
  windowLeft: string;
  openSubmit: () => void;
}) {
  const iconSm = "h-3 w-3 shrink-0 text-[#8B93A7] sm:h-3.5 sm:w-3.5";

  return (
    <div className="hidden md:block w-full min-w-0">
      <header className="flex w-full min-w-0 flex-col bg-[#0B0F14]">
        <div
          className={
            "flex min-h-0 min-w-0 flex-col gap-3 border-b border-[#1F2430] px-4 pt-4 pb-5 " +
            "sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:pb-6"
          }
        >
          <div className="min-w-0 w-full shrink-0 sm:w-auto sm:max-w-[min(100%,42rem)] sm:flex-1">
            <div className="min-w-0">{title}</div>
            {subtitle != null ? <div className="mt-1 min-w-0">{subtitle}</div> : null}
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
            {extraActions}
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
    </div>
  );
}

/** Mobile: slim L-band (logo strip is in AppShell); title + actions stacked for narrow viewports. */
function RecordLShellHeaderMobile({
  title,
  subtitle,
  extraActions,
  utcClock,
  windowLeft,
  openSubmit,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  extraActions?: ReactNode;
  utcClock: string;
  windowLeft: string;
  openSubmit: () => void;
}) {
  const iconSm = "h-3 w-3 shrink-0 text-[#8B93A7]";

  return (
    <div className="md:hidden w-full min-w-0">
      <header className="flex w-full min-w-0 flex-col bg-[#0B0F14]">
        <div
          className={
            "flex min-h-0 min-w-0 flex-col gap-3 border-b border-[#1F2430] px-4 pt-3 pb-4"
          }
        >
          <div className="min-w-0 w-full">
            <div className="min-w-0">{title}</div>
            {subtitle != null ? <div className="mt-1 min-w-0">{subtitle}</div> : null}
          </div>

          <div
            className={
              "flex w-full min-w-0 flex-wrap content-center items-center gap-2"
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
            {extraActions}
            <button
              type="button"
              onClick={openSubmit}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#16C784] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_2px_12px_rgba(22,199,132,0.25)] hover:opacity-95"
            >
              <span className="text-sm font-bold leading-none" aria-hidden>
                +
              </span>
              Submit Entry
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

/** Top band for L-shell (main + rail): title block + UTC + Window + optional extras + Submit. */
export function RecordLShellHeader({
  title,
  subtitle,
  extraActions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  extraActions?: ReactNode;
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

  const shared = { title, subtitle, extraActions, utcClock, windowLeft, openSubmit };

  return (
    <>
      <RecordLShellHeaderDesktop {...shared} />
      <RecordLShellHeaderMobile {...shared} />
    </>
  );
}

/** Operating Record dashboard title + Commit line (L-shell). */
export function DashboardOperatingRecordHeader() {
  return (
    <RecordLShellHeader
      title={shellTitle("Founder Operating Record")}
      subtitle={
        <p className="m-0 text-[11px] font-medium leading-snug text-[#635BFF] sm:text-[12px]">Commit</p>
      }
    />
  );
}

/** L-shell header derived from the current path when a page does not register a custom header. */
export function PathRecordLShellHeader() {
  const pathname = usePathname() || "";

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return <DashboardOperatingRecordHeader />;
  }

  if (pathname === "/tools" || pathname.startsWith("/tools/")) {
    return (
      <RecordLShellHeader
        title={
          <h1
            className={`${h1Shell} flex flex-wrap items-center gap-2.5`}
            style={h1Font}
          >
            <span className={COMING_SOON_PILL_CLASS}>
              <span
                className="h-1 w-1 shrink-0 rounded-full bg-[#34d399] shadow-[0_0_0_1px_rgba(14,164,114,0.4)]"
                aria-hidden
              />
              Coming soon
            </span>
            <span>Connect Tools</span>
          </h1>
        }
      />
    );
  }

  if (pathname === "/signal" || pathname.startsWith("/signal/")) {
    return <RecordLShellHeader title={shellTitle("Signal Score")} />;
  }

  if (pathname === "/directive" || pathname.startsWith("/directive/")) {
    return <RecordLShellHeader title={shellTitle("Daily Directive")} />;
  }

  if (pathname === "/inbox" || pathname.startsWith("/inbox/")) {
    return <RecordLShellHeader title={shellTitle("Inbox")} />;
  }

  if (pathname === "/board" || pathname.startsWith("/board/")) {
    return <RecordLShellHeader title={shellTitle("Feature requests")} />;
  }

  if (pathname === "/settings/profile" || pathname.startsWith("/settings/profile/")) {
    return <RecordLShellHeader title={shellTitle("My Profile")} />;
  }

  if (pathname === "/conexa" || pathname.startsWith("/conexa/")) {
    return <RecordLShellHeader title={shellTitle("Ask Conexa")} />;
  }

  return <RecordLShellHeader title={shellTitle("Oxecute")} />;
}
