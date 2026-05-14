import { forNextResponseCookie } from "@/lib/supabase/merge-response-cookie";
import { supabaseSharedCookieOptions } from "@/lib/supabase/shared-cookie-options";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const sharedCookies = supabaseSharedCookieOptions();

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
              cookieStore.set(name, value, forNextResponseCookie(options)),
            );
          } catch {
            /* ignore: read-only cookie context (e.g. some Server Components) */
          }
        },
      },
    },
  );
}
