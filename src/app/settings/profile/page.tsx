"use client";

import { AuthenticatedShell, useShellUser } from "@/components/app/AuthenticatedShell";
import {
  ExecutionGrid,
  ExecutionStats,
  ProfileHeader,
  ShareCardLocked,
} from "@/components/profile/ProfileSections";
import { useCallback, useEffect, useState } from "react";

function ProfileSettingsMain() {
  const shellUser = useShellUser();
  const [bio, setBio] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [showBreaks, setShowBreaks] = useState(true);
  const [showSignal, setShowSignal] = useState(false);
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [entries, setEntries] = useState<{ day_number: number; tier: string | null }[]>([]);

  const sync = useCallback(async () => {
    const res = await fetch("/api/me", { credentials: "same-origin" });
    const j = await res.json();
    const u = j.user as Record<string, unknown>;
    setBio(String(u.profile_bio ?? ""));
    setProfilePublic(Boolean(u.profile_public ?? false));
    setShowBreaks(Boolean(u.show_breaks ?? true));
    setShowSignal(Boolean(u.show_signal_score ?? false));
    setUsername(String(u.username ?? ""));
    const eRes = await fetch("/api/entries");
    const eJ = await eRes.json();
    const list = (eJ.entries ?? []) as { day_number: number; tier: string }[];
    setEntries(list.map((e) => ({ day_number: e.day_number, tier: e.tier })));
  }, []);

  useEffect(() => {
    void sync();
  }, [sync, shellUser.username]);

  const exec = Number(shellUser.execution_count ?? 0);
  const badges = [
    { label: "21d verified", reached: exec >= 21 },
    { label: "60d verified", reached: exec >= 60 },
    { label: "90d verified", reached: exec >= 90 },
  ];

  const save = async () => {
    setMsg(null);
    const usernameNorm = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    if (usernameNorm !== username.trim().toLowerCase()) {
      setUsername(usernameNorm);
    }
    const body: Record<string, unknown> = {
      profile_bio: bio.trim() ? bio.trim() : null,
      profile_public: profilePublic,
      show_breaks: showBreaks,
      show_signal_score: showSignal,
    };
    if (usernameNorm && usernameNorm !== shellUser.username) {
      if (usernameNorm.length < 3 || usernameNorm.length > 20) {
        setMsg("Username must be 3–20 characters (letters, numbers, _ -).");
        return;
      }
      body.username = usernameNorm;
    }
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: { fieldErrors?: Record<string, string[]> };
      };
      const flat = j.details?.fieldErrors
        ? Object.entries(j.details.fieldErrors)
            .map(([k, v]) => `${k}: ${v?.join(", ")}`)
            .join(" · ")
        : "";
      setMsg(
        [typeof j.error === "string" ? j.error : "Could not save", flat].filter(Boolean).join(" "),
      );
      return;
    }
    setMsg("Saved.");
    if (typeof body.username === "string" && body.username !== shellUser.username) {
      window.location.href = "/settings/profile";
      return;
    }
    await sync();
  };

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      <ProfileHeader
        fullName={String(shellUser.full_name ?? shellUser.username)}
        username={String(shellUser.username)}
        createdAtIso={String(shellUser.created_at ?? new Date().toISOString())}
        foundingMember={Boolean((shellUser as Record<string, unknown>).founding_member)}
        badges={badges}
      />

      <section className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-6 space-y-4">
        <h2 className="font-semibold">Profile settings</h2>
        <label className="block text-sm">
          <span className="text-[var(--t2)]">Bio (max 160)</span>
          <textarea
            className="mt-1 w-full border border-[var(--bdr)] rounded-lg px-3 py-2 text-sm bg-[var(--bg)]"
            maxLength={160}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--t2)]">Username</span>
          <input
            className="mt-1 w-full border border-[var(--bdr)] rounded-lg px-3 py-2 text-sm bg-[var(--bg)]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <span className="text-xs text-[var(--t3)]">3–20 chars, letters, numbers, _-. Locked after 7 days.</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={profilePublic}
            onChange={(e) => setProfilePublic(e.target.checked)}
          />
          Public profile
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showBreaks} onChange={(e) => setShowBreaks(e.target.checked)} />
          Show break count
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showSignal} onChange={(e) => setShowSignal(e.target.checked)} />
          Show Signal score block publicly
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold px-6 py-2 text-sm"
            onClick={() => void save()}
          >
            Save changes
          </button>
        </div>
        {msg ? <p className="text-sm text-[var(--t2)]">{msg}</p> : null}
      </section>

      <ExecutionStats
        executionCount={exec}
        breakCount={Number((shellUser as Record<string, unknown>).break_count ?? 0)}
        showBreaks={showBreaks}
      />

      <ExecutionGrid entries={entries} />

      <ShareCardLocked daysExecuted={exec} unlocked={exec >= 21} />
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / My Profile">
      <ProfileSettingsMain />
    </AuthenticatedShell>
  );
}
