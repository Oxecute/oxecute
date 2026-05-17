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
  refreshKey = 0,
  /** When set, replaces the whole shell (e.g. Day 21 full-screen gate). */
  fullscreenBlock,
}: {
  children: ReactNode;
  refreshKey?: number;
  fullscreenBlock?: (user: AppShellUser) => ReactNode | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = useState<AppShellUser | null>(null);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [userReloadNonce, setUserReloadNonce] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setLoadError(null);
    const ME_TIMEOUT_MS = 25_000;

    const fetchMe = async () => {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), ME_TIMEOUT_MS);
      try {
        return await fetch("/api/me", {
          credentials: "same-origin",
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(tid);
      }
    };

    try {
      /** Prefer `/api/me` first: after OAuth it uses Set-Cookie on this origin immediately, while `getSession()` can wait on a refresh round-trip and look empty. */
      let res = await fetchMe();

      if (res.status === 401) {
        const { error: refreshErr } = await supabase.auth.refreshSession();
        if (!refreshErr) res = await fetchMe();
      }

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (res.status === 404) {
        router.replace("/start");
        return;
      }

      if (!res.ok) {
        setLoadError("Could not load your account. Try again.");
        return;
      }

      const j = await res.json();
      setUser(j.user as AppShellUser);
      setInboxUnread(Number(j.inbox_unread ?? 0));
      authDebug("shell user loaded", {
        execution_count: Number((j.user as AppShellUser).execution_count ?? 0),
      });
      void supabase.auth.getSession();
    } catch (e) {
      authDebug("shell load failed", { message: String(e) });
      const aborted =
        e instanceof DOMException && e.name === "AbortError";
      setLoadError(
        aborted
          ? "Request timed out. Check your connection and try again."
          : "Could not load your account. Try again.",
      );
    }
  }, [router, supabase.auth]);

  const refreshShellUser = useCallback(() => setUserReloadNonce((n) => n + 1), []);

  useEffect(() => {
    void load();
  }, [load, refreshKey, userReloadNonce]);

  if (loadError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg)] text-[var(--t1)] px-6">
        <p className="text-center text-sm max-w-sm">{loadError}</p>
        <button
          type="button"
          className="rounded-full bg-[var(--ac)] text-[var(--mi)] px-5 py-2 text-sm font-semibold"
          onClick={() => setUserReloadNonce((n) => n + 1)}
        >
          Retry
        </button>
        <a href="/login" className="text-sm text-[var(--ac)] underline">
          Back to sign in
        </a>
      </main>
    );
  }

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
            unreadCount={inboxUnread}
            inlineRightRail={<DashboardRightRail />}
          >
            {children}
          </AppShell>
        </ShellUserContext.Provider>
      </ShellUserRefreshContext.Provider>
    </InboxUnreadContext.Provider>
  );
}
