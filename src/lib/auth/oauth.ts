/** Redirect targets after Supabase OAuth (exchange happens in /auth/callback). */
export function oauthRedirectUrl(nextPath: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
