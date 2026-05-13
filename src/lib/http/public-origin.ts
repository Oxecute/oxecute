/**
 * Public origin for redirects and cookies on Vercel (and similar proxies).
 * Prefer forwarded headers when present so host/proto match what the browser used.
 */
export function getPublicOriginFromRequest(request: Request): string {
  const fallback = new URL(request.url).origin;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (!host) return fallback;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (fallback.startsWith("https:") ? "https" : "http");
  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return fallback;
  }
}
