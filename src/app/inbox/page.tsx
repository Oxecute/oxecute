"use client";

import { AuthenticatedShell, useShellUser, useShellUserRefresh } from "@/components/app/AuthenticatedShell";
import { RecordPageHeader, RECORD_PAGE_SUBTITLE_CLASS } from "@/components/app/RecordPageHeader";
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
    <div className="space-y-6 max-w-3xl w-full min-w-0">
      <RecordPageHeader
        title={
          <h1 className="text-[20px] sm:text-[22px] font-extrabold tracking-[-0.02em] text-[#EAEFF8]" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
            Inbox
          </h1>
        }
        subtitle={<p className={RECORD_PAGE_SUBTITLE_CLASS}>System and product notices for @{user.username}.</p>}
        extraActions={
          <button
            type="button"
            className="rounded-full bg-transparent px-3.5 py-1.5 text-[12px] font-semibold text-[#0EA472] border border-[#0EA472]/45 hover:bg-[#0EA472]/10"
            onClick={() => void markAll()}
          >
            Mark all read
          </button>
        }
      />

      {loading ? <p className="text-[var(--t2)]">Loading…</p> : null}

      <ul className="space-y-2">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border p-4 text-sm min-w-0 ${
              n.read ? "border-[var(--bdr)] bg-[var(--sur)]" : "border-[var(--p)]/40 bg-[var(--sur2)]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2 gap-x-4">
              <p className="font-semibold text-[#EAEFF8] break-words whitespace-normal min-w-0 flex-1 leading-snug">
                {n.title}
              </p>
              <span className="text-xs text-[#A8B0CC] tabular-nums shrink-0">
                {new Date(n.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {n.body ? (
              <p className="text-[#B4BCCF] mt-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                {n.body}
              </p>
            ) : null}
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
    <AuthenticatedShell>
      <InboxMain />
    </AuthenticatedShell>
  );
}
