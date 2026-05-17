"use client";

import { AuthenticatedShell, useShellUser, useShellUserRefresh } from "@/components/app/AuthenticatedShell";
import { useCallback, useEffect, useState } from "react";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  read: boolean;
  created_at: string;
};

function InboxMain() {
  const user = useShellUser();
  const refreshShellUser = useShellUserRefresh();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/inbox");
    const j = await res.json();
    setItems(j.notifications ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markOne = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch("/api/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      refreshShellUser();
    } catch {
      await load();
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      });
      refreshShellUser();
    } catch {
      await load();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-sm text-[var(--t2)] mt-1">
            System and product notices for @{user.username}.
          </p>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-[var(--p)]"
          onClick={() => void markAll()}
        >
          Mark all read
        </button>
      </div>

      {loading ? <p className="text-[var(--t2)]">Loading…</p> : null}

      <ul className="space-y-2">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border p-4 text-sm ${
              n.read ? "border-[var(--bdr)] bg-[var(--sur)]" : "border-[var(--p)]/40 bg-[var(--sur2)]"
            }`}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-semibold text-[var(--t1)]">{n.title}</p>
              <span className="text-xs text-[var(--t3)] tabular-nums">
                {new Date(n.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {n.body ? <p className="text-[var(--t2)] mt-2">{n.body}</p> : null}
            <div className="flex flex-wrap gap-3 mt-3">
              {n.action_url ? (
                <a href={n.action_url} className="text-[var(--p)] text-sm font-medium">
                  Open
                </a>
              ) : null}
              {!n.read ? (
                <button
                  type="button"
                  className="text-xs text-[var(--t3)] underline"
                  onClick={() => void markOne(n.id)}
                >
                  Mark read
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 ? (
        <p className="text-[var(--t2)] text-sm">No notifications yet.</p>
      ) : null}
    </div>
  );
}

export default function InboxPage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / Inbox">
      <InboxMain />
    </AuthenticatedShell>
  );
}
