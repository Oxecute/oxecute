import { createBrowserClient } from "@supabase/ssr";

/**
 * When apex (oxecute.com) 307s to www, PKCE cookies set on one host are invisible on the other
 * unless `Domain=.oxecute.com`. Set on Vercel: NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN=.oxecute.com
 * Omit locally (do not set for localhost).
 */
function supabaseBrowserOptions() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN?.trim();
  if (!raw) return {};
  const domain = raw.startsWith(".") ? raw : `.${raw}`;
  return {
    cookieOptions: {
      domain,
      path: "/",
      sameSite: "lax" as const,
      secure: true,
    },
  };
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseBrowserOptions(),
  );
}
