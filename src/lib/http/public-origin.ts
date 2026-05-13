/**
 * Origin for post-auth redirects (e.g. OAuth callback).
 *
 * Always use the host from `request.url` for non-local requests. On Vercel,
 * `x-forwarded-host` can differ from that host (e.g. apex vs `www`). Session
 * cookies from `exchangeCodeForSession` are host-scoped to the callback URL;
 * redirecting to a different host drops the session on mobile.
 */
export function getPublicOriginFromRequest(request: Request): string {
  const u = new URL(request.url);
  const host = u.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    return u.origin;
  }

  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (!forwarded) return u.origin;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  try {
    return new URL(`${proto}://${forwarded}`).origin;
  } catch {
    return u.origin;
  }
}
