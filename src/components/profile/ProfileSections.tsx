const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://oxecute.com";

export function ProfileHeader({
  fullName,
  username,
  createdAtIso,
  foundingMember,
  badges,
}: {
  fullName: string;
  username: string;
  createdAtIso: string;
  foundingMember: boolean;
  badges: { label: string; reached: boolean }[];
}) {
  const initials = fullName
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
      <div className="w-16 h-16 rounded-full bg-[var(--p)] text-[var(--fw)] flex items-center justify-center font-bold text-lg shrink-0">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold">{fullName}</h1>
        <p className="text-[var(--t2)] text-sm mt-1">
          @{username} · Building since{" "}
          {new Date(createdAtIso).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {foundingMember ? (
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-[var(--sur2)] border border-[var(--bdr)]">
              Founding Member · Beta cohort
            </span>
          ) : null}
          {badges
            .filter((b) => b.reached)
            .map((b) => (
              <span
                key={b.label}
                className="inline-block text-xs px-3 py-1 rounded-full bg-[rgba(34,197,94,0.15)] border border-[var(--green)]/40 text-[var(--t1)]"
              >
                {b.label}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

export function ExecutionStats({
  executionCount,
  breakCount,
  showBreaks,
}: {
  executionCount: number;
  breakCount: number;
  showBreaks: boolean;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 mb-8">
      <div className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)]">
        <p className="text-xs text-[var(--t3)]">Days executed</p>
        <p className="text-3xl font-bold">{executionCount}</p>
      </div>
      {showBreaks ? (
        <div className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)]">
          <p className="text-xs text-[var(--t3)]">Breaks on record</p>
          <p className="text-3xl font-bold">{breakCount}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--bdr)] p-4 bg-[var(--sur2)] flex items-center">
          <p className="text-sm text-[var(--t3)]">Break counts hidden by this founder.</p>
        </div>
      )}
    </div>
  );
}

type EntryTile = { day_number: number; tier: string | null };

export function ExecutionGrid({
  entries,
  maxDays = 30,
  breakDays = [],
  onDayClick,
}: {
  entries: EntryTile[];
  maxDays?: number;
  /** Days with a break mark (no execution tile). Matches dashboard FOR grid. */
  breakDays?: number[];
  onDayClick?: (day: number, entry: EntryTile | undefined) => void;
}) {
  const breakSet = new Set(breakDays);
  return (
    <div>
      <p className="text-xs text-[var(--t3)] mb-2">Execution heatmap · {maxDays}-day window</p>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: maxDays }).map((_, i) => {
          const day = i + 1;
          const ent = entries.find((e) => Number(e.day_number) === day);
          const isBreakDay = breakSet.has(day);
          let bg = "bg-black/5 dark:bg-white/5";
          if (ent?.tier === "verified_proof") bg = "bg-[#0EA472]";
          else if (ent?.tier === "declaration_pending") bg = "bg-[rgba(124,100,220,0.75)]";
          else if (ent?.tier === "upload_unverified") bg = "bg-[rgba(194,164,120,0.75)]";
          else if (ent?.tier === "signup_execution") bg = "bg-[rgba(14,164,114,0.35)]";
          else if (isBreakDay) bg = "bg-[#E24B4A]";
          const interactive = Boolean(onDayClick && ent);
          const title =
            isBreakDay && !ent ? `Day ${day} · Break` : isBreakDay && ent ? `Day ${day} · Break + logged` : `Day ${day}`;
          return (
            <button
              key={day}
              type="button"
              disabled={!interactive}
              title={title}
              {...(interactive && onDayClick
                ? {
                    onClick: () => {
                      onDayClick(day, ent);
                    },
                  }
                : {})}
              className={`aspect-square rounded ${bg} opacity-80 ${
                interactive ? "cursor-pointer hover:ring-2 ring-[var(--ac)]" : "cursor-default"
              }`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-[var(--t3)]">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#0EA472]" /> Verified
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[rgba(124,100,220,0.75)]" /> Declaration
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[rgba(194,164,120,0.75)]" /> File upload
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[rgba(14,164,114,0.35)]" /> Signup / Day 1
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#E24B4A]" /> Break
        </span>
      </div>
    </div>
  );
}

export function EmbedBadge({ username }: { username: string }) {
  const snippet = `<a href="${APP_URL}/${username}" title="${username} on Oxecute">Verified on Oxecute</a>`;
  return (
    <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4 mt-10">
      <p className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wide mb-2">Embed badge</p>
      <pre className="text-xs bg-[var(--sur2)] p-3 rounded-lg overflow-x-auto text-[var(--t2)]">{snippet}</pre>
    </div>
  );
}

export function ShareCardLocked({ daysExecuted, unlocked }: { daysExecuted: number; unlocked: boolean }) {
  if (unlocked) return null;
  const toGo = Math.max(0, 21 - daysExecuted);
  return (
    <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur2)] p-6 mt-8 text-center">
      <p className="text-sm font-semibold text-[var(--t1)]">Share card</p>
      <p className="text-sm text-[var(--t2)] mt-2">
        Unlocks at 21 verified days executed - {toGo === 0 ? "finish remaining gates on your record." : `${toGo} to go.`}
      </p>
    </div>
  );
}
