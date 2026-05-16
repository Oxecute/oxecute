import { createBrowserClient } from "@supabase/ssr";

import { supabaseBrowserCookieOptions } from "./shared-cookie-options";

export function createClient() {
  const cookieOptions = supabaseBrowserCookieOptions();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      isSingleton: false,
      ...(cookieOptions ? { cookieOptions } : {}),
    },
  );
}
