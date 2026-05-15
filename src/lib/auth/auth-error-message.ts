/** Turn Supabase / OAuth query `auth_error` text into short, actionable copy on mobile. */
export function userFacingAuthError(decoded: string): string {
  const lower = decoded.toLowerCase();
  if (lower.includes("pkce") || lower.includes("code verifier")) {
    return [
      "Google sign-in could not finish (PKCE).",
      "",
      "• Tap “Clear site sign-in cookies” below, then try Google again.",
      "• Open this site in Safari or Chrome — not inside Instagram, TikTok, or Facebook.",
      "• Use the same address you started with (with or without www).",
    ].join("\n");
  }
  return decoded;
}
