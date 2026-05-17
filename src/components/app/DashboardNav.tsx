"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type { NavItem } from "./dashboard-nav-config";
import {
  COMING_SOON_PILL_CLASS,
  NAV_NETWORK_ITEMS,
  NAV_OVERVIEW_ITEMS,
  NAV_TOOL_ITEMS,
} from "./dashboard-nav-config";

export type MeUser = {
  username: string;
  full_name?: string;
  execution_count?: number;
  day7_reached?: boolean;
  day21_reached?: boolean;
  day21_unlocked?: boolean;
  day45_reached?: boolean;
};

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function showLockpill(item: NavItem, user: MeUser): string | null {
  if (item.href === "/signal" || item.href === "/directive") {
    if (!user.day21_reached) return item.lockLabel ?? "Day 21";
  }
  return null;
}

function NavIcon({ href }: { href: string }) {
  const common = "shrink-0 text-current opacity-90";
  const s = "w-[18px] h-[18px]";
  switch (href) {
    case "/dashboard":
      return (
        <svg className={`${s} ${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "/signal":
      return (
        <svg className={`${s} ${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M13 2L4.09 12.5a2 2 0 001.64 3.2h5.09L11 22l8.91-10.5a2 2 0 00-1.64-3.2h-5.09L13 2z" strokeLinejoin="round" />
        </svg>
      );
    case "/directive":
      return (
        <span className={`${s} inline-flex items-center justify-center font-semibold text-[15px] leading-none ${common}`} aria-hidden>
          @
        </span>
      );
    case "/inbox":
      return (
        <svg className={`${s} ${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M22 12h-6l-2 3H10L8 12H2" strokeLinejoin="round" />
          <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinejoin="round" />
        </svg>
      );
    case "/community":
      return (
        <svg className={`${s} ${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
        </svg>
      );
    case "/angels":
      return (
        <svg className={`${s} ${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "/coaches":
      return (
        <svg className={`${s} ${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
        </svg>
      );
    case "/tools":
      return (
        <svg className={`${s} ${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" />
        </svg>
      );
    case "/board":
      return (
        <svg className={`${s} ${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinejoin="round" />
          <path d="M12 8v6M9 11h6" strokeLinecap="round" />
        </svg>
      );
    case "/settings/profile":
      return (
        <svg className={`${s} ${common}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return (
        <span className={`${s} inline-block rounded bg-zinc-700 ${common}`} aria-hidden />
      );
  }
}

function LogOutIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`shrink-0 w-[18px] h-[18px] ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navRowBase =
  "flex items-center gap-2.5 py-2 pl-2 pr-2 rounded-lg text-[13px] leading-snug border-l-[3px] transition-colors";
const navRowActive =
  "border-l-[#2dd4bf] text-white font-medium bg-gradient-to-r from-[rgba(14,164,114,0.22)] via-[rgba(45,212,191,0.1)] to-transparent shadow-[inset_0_0_24px_-14px_rgba(45,212,191,0.2)] [&_svg]:text-[#a7f3d0]";
const navRowIdle =
  "border-l-transparent text-zinc-300 hover:bg-[rgba(14,164,114,0.12)] hover:text-[#a7f3d0] hover:border-l-[rgba(45,212,191,0.35)]";
const navRowDisabled =
  "border-l-transparent text-zinc-500 cursor-not-allowed hover:bg-transparent hover:text-zinc-500";

function NavSection({
  title,
  user,
  items,
  onNavigate,
  inboxUnread,
  soonBadge,
  forceDisabled,
}: {
  title: string;
  user: MeUser;
  items: NavItem[];
  onNavigate?: () => void;
  inboxUnread: number;
  soonBadge?: boolean;
  forceDisabled?: boolean;
}) {
  const pathname = usePathname();
  return (
    <div className="mb-4 last:mb-0">
      {soonBadge ? (
        <div className="flex items-center gap-2 px-2 mb-1.5 flex-wrap">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.14em]">{title}</p>
          <span className={COMING_SOON_PILL_CLASS} title={`${title} — coming soon`}>
            <span className="w-1 h-1 rounded-full bg-[#34d399] shadow-[0_0_0_1px_rgba(14,164,114,0.4)] shrink-0" aria-hidden />
            Coming soon
          </span>
        </div>
      ) : (
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.14em] px-2 mb-1.5">{title}</p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const active =
            !item.disabled &&
            !forceDisabled &&
            (item.href === "/settings/profile"
              ? pathname === "/settings/profile" || pathname.startsWith("/settings/")
              : navActive(pathname, item.href));
          const pill = showLockpill(item, user);
          const isInbox = item.href === "/inbox";
          const disabled = Boolean(item.disabled || forceDisabled);

          if (disabled) {
            return (
              <div key={item.href} className={`${navRowBase} ${navRowDisabled}`}>
                <NavIcon href={item.href} />
                <span className="min-w-0">{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`${navRowBase} ${active ? navRowActive : navRowIdle} flex`}
            >
              <NavIcon href={item.href} />
              <span
                className={`min-w-0 flex-1 ${item.href === "/tools" ? "whitespace-nowrap" : ""}`}
              >
                {item.label}
              </span>
              {item.href === "/tools" ? (
                <span className={COMING_SOON_PILL_CLASS} title="Connect Tools — coming soon">
                  <span className="w-1 h-1 rounded-full bg-[#34d399] shadow-[0_0_0_1px_rgba(14,164,114,0.4)] shrink-0" aria-hidden />
                  Coming soon
                </span>
              ) : null}
              {isInbox && inboxUnread > 0 ? (
                <span className="text-[10px] font-bold tabular-nums text-white bg-red-500/90 min-w-[1.25rem] h-5 px-1 rounded-md flex items-center justify-center shrink-0">
                  {inboxUnread > 99 ? "99+" : inboxUnread}
                </span>
              ) : null}
              {pill ? (
                <span className="text-[8px] font-medium tracking-wide text-zinc-500 normal-case shrink-0">{pill}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardNav({
  user,
  onNavigate,
  className = "",
  inboxUnread = 0,
}: {
  user: MeUser;
  items?: NavItem[];
  onNavigate?: () => void;
  className?: string;
  inboxUnread?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const settingsActive = pathname === "/settings/profile" || pathname.startsWith("/settings/");
  const initials = String(user.full_name ?? user.username ?? "?")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className={`flex flex-col flex-1 min-h-0 text-sm ${className}`}>
      <div className="shrink-0 overflow-visible pr-1">
        <Link
          href="/dashboard"
          className="flex items-center justify-start w-full overflow-visible py-2.5 pl-0.5 pr-4 mb-0.5"
          onClick={onNavigate}
        >
          <img
            src="/brand/Logo-04.svg?v=5"
            alt="Oxecute"
            width={400}
            height={102}
            className="h-[15.552px] sm:h-[16.848px] w-auto max-w-none object-contain object-left shrink-0 block"
            decoding="async"
          />
        </Link>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-none pr-0.5 -mr-0.5">
        <div className="border-t border-zinc-800/80 pt-2.5 mt-0.5">
          <NavSection title="Overview" user={user} items={NAV_OVERVIEW_ITEMS} onNavigate={onNavigate} inboxUnread={inboxUnread} />
          <NavSection
            title="Network"
            user={user}
            items={NAV_NETWORK_ITEMS}
            onNavigate={onNavigate}
            inboxUnread={inboxUnread}
            soonBadge
            forceDisabled
          />
          <NavSection title="Tools" user={user} items={NAV_TOOL_ITEMS} onNavigate={onNavigate} inboxUnread={inboxUnread} />
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 space-y-3">
          <Link
            href="/settings/profile"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-2 py-1.5 -mx-1 rounded-lg hover:bg-white/[0.06] transition-colors min-w-0 ${
              settingsActive ? "ring-1 ring-[#2dd4bf]/45 bg-white/[0.04]" : ""
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-[#4F46E5] text-white text-xs font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">{user.full_name ?? user.username}</p>
              <p className="text-[11px] text-zinc-400 truncate">@{user.username}</p>
            </div>
          </Link>
          <div className="space-y-0.5">
            <button
              type="button"
              className={`${navRowBase} w-full text-left flex items-center border-l-transparent text-red-400/90 hover:text-red-400 hover:bg-red-500/10 hover:border-l-transparent`}
              onClick={async () => {
                onNavigate?.();
                await supabase.auth.signOut();
                router.push("/login");
                router.refresh();
              }}
            >
              <LogOutIcon className="opacity-90" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
