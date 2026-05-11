/** One-line preview for dashboard / lists (no network). */
export function submissionBrief(entry: {
  tier?: string | null;
  url?: string | null;
  declaration_text?: string | null;
  category?: string | null;
}): string {
  const tier = String(entry.tier ?? "");
  const url = entry.url ? String(entry.url) : "";
  const decl = entry.declaration_text ? String(entry.declaration_text) : "";

  if (tier === "verified_proof" && url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return `${host} · verified link`;
    } catch {
      const u = url.replace(/\s+/g, " ").trim();
      return u.length > 72 ? `${u.slice(0, 70)}…` : u;
    }
  }

  if (decl) {
    const line = decl.replace(/\s+/g, " ").trim();
    const stop = line.search(/[.!?]\s/);
    const first =
      stop >= 0 ? line.slice(0, stop + 1).trim() : line;
    const max = 100;
    if (first.length <= max) return first;
    return `${first.slice(0, max - 1).trimEnd()}…`;
  }

  return tier.replace(/_/g, " ") || "Entry";
}
