import type { CookieOptionsWithName } from "@supabase/ssr";

function sharedCookieSameSite(): "lax" | "none" | "strict" {
  const raw =
    process.env.NEXT_PUBLIC_SUPABASE_COOKIE_SAMESITE?.trim().toLowerCase();
  if (raw === "none") return "none";
  if (raw === "strict") return "strict";
  return "lax";
}

/**
 * Same Domain on browser + server so PKCE verifier / flow state cookies survive
 * `www` vs apex and aren’t replaced by host-only cookies from middleware/API routes.
 *
 * Production: set `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN=.oxecute.com` (Vercel + local when testing HTTPS tunnel).
 * Local http://localhost:3000: leave unset (no Domain attribute).
 *
 * Optional: `NEXT_PUBLIC_SUPABASE_COOKIE_SAMESITE=none` (HTTPS only) if some mobile WebViews still drop Lax PKCE cookies.
 */
export function supabaseSharedCookieOptions():
  | CookieOptionsWithName
  | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN?.trim();
  if (!raw) return undefined;
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
  const base = supabaseSharedCookieOptions();
  if (!base || typeof window === "undefined") return base;
  return {
    ...base,
    secure: window.location.protocol === "https:",
  };
}
