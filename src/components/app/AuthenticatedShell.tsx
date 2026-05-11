"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AppShell, type AppShellUser } from "./AppShell";
import { RightRail } from "./RightRail";

export const ShellUserContext = createContext<AppShellUser | null>(null);

/** Re-run `/api/me` after mutations (e.g. entry submit) so `last_submission_date` stays in sync. */
export const ShellUserRefreshContext = createContext<(() => void) | null>(null);

export function useShellUser(): AppShellUser {
  const u = useContext(ShellUserContext);
  if (!u) throw new Error("useShellUser must be used inside AuthenticatedShell");
  return u;
}

export function useShellUserRefresh(): () => void {
  const fn = useContext(ShellUserRefreshContext);
  if (!fn) throw new Error("useShellUserRefresh must be used inside AuthenticatedShell");
  return fn;
}

export function AuthenticatedShell({
  children,
  breadcrumb = "Dashboards / Founder Operating Record",
  showRightRail = false,
  refreshKey = 0,
  /** When set, replaces the whole shell (e.g. Day 21 full-screen gate). */
  fullscreenBlock,
}: {
  children: React.ReactNode;
  breadcrumb?: string;
  showRightRail?: boolean;
  refreshKey?: number;
  fullscreenBlock?: (user: AppShellUser) => React.ReactNode | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = useState<AppShellUser | null>(null);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [userReloadNonce, setUserReloadNonce] = useState(0);

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    const res = await fetch("/api/me", { credentials: "same-origin" });
    if (!res.ok) {
      router.push("/start");
      return;
    }
    const j = await res.json();
    setUser(j.user as AppShellUser);
    setInboxUnread(Number(j.inbox_unread ?? 0));
  }, [router, supabase.auth]);

  const refreshShellUser = useCallback(() => setUserReloadNonce((n) => n + 1), []);

  useEffect(() => {
    void load();
  }, [load, refreshKey, userReloadNonce]);

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--t1)]">
        Loading…
      </main>
    );
  }

  const block = fullscreenBlock?.(user);
  if (block) {
    return (
      <ShellUserRefreshContext.Provider value={refreshShellUser}>
        <ShellUserContext.Provider value={user}>{block}</ShellUserContext.Provider>
      </ShellUserRefreshContext.Provider>
    );
  }

  return (
    <ShellUserRefreshContext.Provider value={refreshShellUser}>
      <ShellUserContext.Provider value={user}>
        <AppShell
          user={user}
          breadcrumb={breadcrumb}
          unreadCount={inboxUnread}
          rightRail={showRightRail ? <RightRail user={user} /> : undefined}
        >
          {children}
        </AppShell>
      </ShellUserContext.Provider>
    </ShellUserRefreshContext.Provider>
  );
}
