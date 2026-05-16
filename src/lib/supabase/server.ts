import { forNextResponseCookie } from "@/lib/supabase/merge-response-cookie";
import { supabaseSharedCookieOptionsForHost } from "@/lib/supabase/shared-cookie-options";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

function requestHostnameFromHeaders(h: Headers): string {
  const xf = h.get("x-forwarded-host");
  const first = (xf?.split(",")[0] ?? h.get("host") ?? "").trim();
  return first.replace(/:\d+$/, "").toLowerCase();
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const h = await headers();
  const hostname = requestHostnameFromHeaders(h);
  const sharedCookies = supabaseSharedCookieOptionsForHost(hostname);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(sharedCookies ? { cookieOptions: sharedCookies } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(
                name,
                value,
                forNextResponseCookie(options, hostname),
              ),
            );
          } catch {
            /* ignore: read-only cookie context (e.g. some Server Components) */
          }
        },
      },
    },
  );
}
