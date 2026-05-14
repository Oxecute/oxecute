import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Same Domain on browser + server so PKCE verifier / flow state cookies survive
 * `www` vs apex and aren’t replaced by host-only cookies from middleware/API routes.
 *
 * Production: set `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN=.oxecute.com` (Vercel + local when testing HTTPS tunnel).
 * Local http://localhost:3000: leave unset (no Domain attribute).
 */
export function supabaseSharedCookieOptions():
  | CookieOptionsWithName
  | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN?.trim();
  if (!raw) return undefined;
  const domain = raw.startsWith(".") ? raw : `.${raw}`;
  return {
    domain,
    path: "/",
    sameSite: "lax",
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
