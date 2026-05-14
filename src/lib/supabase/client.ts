import { createBrowserClient } from "@supabase/ssr";

import { supabaseSharedCookieOptions } from "./shared-cookie-options";

export function createClient() {
  const cookieOptions = supabaseSharedCookieOptions();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(cookieOptions ? { cookieOptions } : {}),
    },
  );
}
