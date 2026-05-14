/**
 * Production canonical URL for OAuth (must match Supabase Site URL).
 * Vercel: set to `https://oxecute.com` (no trailing slash).
 * Preview (`*.vercel.app`) and localhost use the current browser origin instead.
 */
export function getPublicSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

/**
 * Origin for `signInWithOAuth` redirectTo — **must equal `window.location.origin`** so the PKCE
 * cookie written on this host is sent to `/auth/callback`. Do not substitute
 * `NEXT_PUBLIC_SITE_URL` when the user might be on `www` and env points at apex (or vice versa).
 */
export function getBrowserOAuthOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}
