/**
 * Distinct FOR day numbers that have a break mark, from `break_marks` plus
 * legacy rows whose notification title encodes the day.
 */
export function mergeBreakDayNumbers(
  breakRows: { day_number: number }[] | null | undefined,
  breakNotifs: { title: string | null }[] | null | undefined,
): number[] {
  const fromMarks = (breakRows ?? [])
    .map((r) => Number(r.day_number))
    .filter((n) => Number.isFinite(n) && n > 0);
  const fromTitles = (breakNotifs ?? [])
    .map((row) => {
      const m = /Break mark written\s*-\s*Day\s*(\d+)/i.exec(String(row.title ?? ""));
      return m ? Number(m[1]) : NaN;
    })
    .filter((n) => Number.isFinite(n) && n > 0);
  return [...new Set([...fromMarks, ...fromTitles])];
}
