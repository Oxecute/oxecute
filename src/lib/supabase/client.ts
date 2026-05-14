import { createBrowserClient } from "@supabase/ssr";

/**
 * Use default host-only auth cookies (works with www as primary host after Vercel 307).
 * Avoid `Domain=.oxecute.com` — it often causes duplicate PKCE cookies and
 * "code challenge does not match" / "invalid flow state" errors.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
