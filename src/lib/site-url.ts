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

/** Origin used in `signInWithOAuth` redirectTo — must match the host that holds the PKCE cookie. */
export function getBrowserOAuthOrigin(): string {
  if (typeof window === "undefined") return "";
  const { hostname, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return origin;
  if (hostname.endsWith(".vercel.app")) return origin;
  const canonical = getPublicSiteOrigin();
  if (canonical) return canonical;
  return origin;
}
