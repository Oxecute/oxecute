/**
 * Redirect targets after Supabase OAuth (exchange happens in /auth/callback).
 *
 * In Supabase → Authentication → URL configuration, add this origin’s
 * `https://YOUR_DOMAIN/auth/callback` (and `/**` if you use wildcards). If the
 * requested redirect is not allowed, Auth falls back to **Site URL** (often `/`),
 * which would strand users on the marketing page without a session.
 */
export function oauthRedirectUrl(nextPath: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
