/** Shorter, readable Conexa surfaces (Changes.pdf: no long dashes). Tab bodies clamp loosely so dashboard copy is not cut mid-sentence. */

export const CONEXA_MISSING_TAB_PLACEHOLDER =
  "More context needed. Keep building your record.";

/** Replace em/en dash with ASCII hyphen for cleaner UI. */
export function normalizeConexaDashes(s: string): string {
  return s.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
}

/** Cap tab body length for predictable UI (avoid mid-sentence cuts in dashboard reads). */
export function clampConexaTabBody(
  text: string,
  maxLines = 80,
  maxChars = 12000,
): string {
  const t = normalizeConexaDashes(text).trim();
  if (!t) return CONEXA_MISSING_TAB_PLACEHOLDER;
  const lines = t
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let out = lines.slice(0, maxLines).join("\n");
  if (out.length > maxChars) {
    out = `${out.slice(0, maxChars - 1).trimEnd()}…`;
  }
  return out;
}

export function clampConexaPersonalInsight(text: string): string {
  return clampConexaTabBody(text, 4, 400);
}
