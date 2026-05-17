import type { CookieOptionsWithName } from "@supabase/ssr";

function sharedCookieSameSite(): "lax" | "none" | "strict" {
  const raw =
    process.env.NEXT_PUBLIC_SUPABASE_COOKIE_SAMESITE?.trim().toLowerCase();
  if (raw === "lax") return "lax";
  if (raw === "strict") return "strict";
  if (raw === "none") return "none";
  /**
   * With `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN`, default `None` + `Secure` so the PKCE
   * verifier cookie survives Google → site redirects on some mobile browsers/WebViews.
   * Override locally with `NEXT_PUBLIC_SUPABASE_COOKIE_SAMESITE=lax` if needed (e.g. http + domain).
   */
  if (process.env.NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN?.trim()) {
    return "none";
  }
  return "lax";
}

/** `hostname` must be lowercase host without port, e.g. `www.oxecute.com`. */
export function supabaseCookieDomainAppliesToHost(hostname: string): boolean {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN?.trim();
  if (!raw || !hostname) return false;
  const base = (raw.startsWith(".") ? raw.slice(1) : raw).toLowerCase();
  const hn = hostname.replace(/:\d+$/, "").toLowerCase();
  return hn === base || hn.endsWith(`.${base}`);
}

/**
 * Same Domain on browser + server so PKCE verifier / flow state cookies survive
 * `www` vs apex and aren’t replaced by host-only cookies from middleware/API routes.
 *
 * Only applied when the **current host** matches `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN`.
 * If env is set to e.g. `.oxecute.com` but the user is on `*.vercel.app`, we skip the Domain
 * attribute so the browser does not reject cookies (fixes “PKCE verifier not found”).
 */
export function supabaseSharedCookieOptionsForHost(
  hostname: string,
): CookieOptionsWithName | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN?.trim();
  if (!raw || !supabaseCookieDomainAppliesToHost(hostname)) return undefined;
  const domain = raw.startsWith(".") ? raw : `.${raw}`;
  const sameSite = sharedCookieSameSite();
  return {
    domain,
    path: "/",
    sameSite,
    secure: true,
  };
}

/** Browser client only: avoid Secure cookies on http origins if domain is misconfigured locally. */
export function supabaseBrowserCookieOptions():
  | CookieOptionsWithName
  | undefined {
  if (typeof window === "undefined") return undefined;
  const base = supabaseSharedCookieOptionsForHost(window.location.hostname);
  if (!base) return undefined;
  return {
    ...base,
    secure: window.location.protocol === "https:",
  };
}
