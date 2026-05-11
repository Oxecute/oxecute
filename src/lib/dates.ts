export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function utcTodayISO(): string {
  const n = new Date();
  return n.toISOString().slice(0, 10);
}

/** Calendar execution day from signup (Day 1 = signup calendar day in UTC). */
export function executionDayNumber(createdAtIso: string, ref: Date = new Date()): number {
  const created = new Date(createdAtIso);
  const diff =
    startOfUtcDay(ref).getTime() - startOfUtcDay(created).getTime();
  return Math.floor(diff / 86400000) + 1;
}

export function executionRate(executionCount: number, createdAtIso: string): number {
  const created = new Date(createdAtIso);
  const now = new Date();
  const days = Math.max(
    1,
    Math.floor(
      (startOfUtcDay(now).getTime() - startOfUtcDay(created).getTime()) /
        86400000,
    ),
  );
  return Math.min(100, Math.max(0, Math.round((executionCount / days) * 100)));
}

export function secondsUntilUtcEndOfDay(now: Date = new Date()): number {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59),
  );
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}
