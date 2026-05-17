/** Shorter, readable Conexa surfaces (Changes.pdf: no long dashes). Tab bodies clamp loosely so dashboard copy is not cut mid-sentence. */

export const CONEXA_MISSING_TAB_PLACEHOLDER =
  "More context needed. Keep building your record.";

/** Replace em/en dash with ASCII hyphen for cleaner UI. */
export function normalizeConexaDashes(s: string): string {
  return s.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
}

/** Keep the first N complete sentences (split after ., !, ? plus whitespace). */
export function limitSentences(text: string, maxSentences: number): string {
  const t = normalizeConexaDashes(text).trim();
  if (!t || maxSentences < 1) return t;
  const parts = t.split(/(?<=[.!?])\s+/).filter((p) => p.trim().length > 0);
  if (parts.length <= 1 && !/[.!?]$/.test(t)) {
    return t;
  }
  if (parts.length <= maxSentences) return parts.join(" ").trim();
  return parts.slice(0, maxSentences).join(" ").trim();
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
    const slice = out.slice(0, maxChars);
    const lastSentence = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("? "),
    );
    if (lastSentence > maxChars * 0.5) {
      out = slice.slice(0, lastSentence + 1).trimEnd();
    } else {
      out = `${slice.trimEnd()}…`;
    }
  }
  return out;
}

export function clampConexaPersonalInsight(text: string): string {
  const t = normalizeConexaDashes(text).trim();
  if (!t) return CONEXA_MISSING_TAB_PLACEHOLDER;
  let out = limitSentences(t, 4);
  if (out.length > 1800) {
    out = `${out.slice(0, 1797).trimEnd()}…`;
  }
  return out;
}
