"use client";

import { authDebug } from "@/lib/auth/debug";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { AppShell, type AppShellUser } from "./AppShell";
import { DashboardRightRail } from "./DashboardRightRail";

export const InboxUnreadContext = createContext<number>(0);
export const ShellUserContext = createContext<AppShellUser | null>(null);

/** Re-run `/api/me` after mutations (e.g. entry submit) so `last_submission_date` stays in sync. */
export const ShellUserRefreshContext = createContext<(() => void) | null>(null);

export function useShellUser(): AppShellUser {
  const u = useContext(ShellUserContext);
  if (!u) throw new Error("useShellUser must be used inside AuthenticatedShell");
  return u;
}

export function useInboxUnread(): number {
  return useContext(InboxUnreadContext);
}

export function useShellUserRefresh(): () => void {
  const fn = useContext(ShellUserRefreshContext);
  if (!fn) throw new Error("useShellUserRefresh must be used inside AuthenticatedShell");
  return fn;
}

export function AuthenticatedShell({
  children,
  breadcrumb = "Dashboards / Founder Operating Record",
  refreshKey = 0,
  /** When set, replaces the whole shell (e.g. Day 21 full-screen gate). */
  fullscreenBlock,
}: {
  children: ReactNode;
  breadcrumb?: string;
  refreshKey?: number;
  fullscreenBlock?: (user: AppShellUser) => ReactNode | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = useState<AppShellUser | null>(null);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [userReloadNonce, setUserReloadNonce] = useState(0);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_DEBUG !== "1") return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      authDebug("onAuthStateChange", {
        event,
        hasSession: Boolean(session),
      });
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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
    authDebug("shell user loaded", {
      execution_count: Number((j.user as AppShellUser).execution_count ?? 0),
    });
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
      <InboxUnreadContext.Provider value={inboxUnread}>
        <ShellUserRefreshContext.Provider value={refreshShellUser}>
          <ShellUserContext.Provider value={user}>{block}</ShellUserContext.Provider>
        </ShellUserRefreshContext.Provider>
      </InboxUnreadContext.Provider>
    );
  }

  return (
    <InboxUnreadContext.Provider value={inboxUnread}>
      <ShellUserRefreshContext.Provider value={refreshShellUser}>
        <ShellUserContext.Provider value={user}>
          <AppShell
            user={user}
            breadcrumb={breadcrumb}
            unreadCount={inboxUnread}
            summaryPanel={<DashboardRightRail variant="notifications" />}
            inlineRightRail={<DashboardRightRail />}
          >
            {children}
          </AppShell>
        </ShellUserContext.Provider>
      </ShellUserRefreshContext.Provider>
    </InboxUnreadContext.Provider>
  );
}
