import type { CookieOptions } from "@supabase/ssr";

import { forNextSetCookie } from "./for-next-cookie";
import { supabaseSharedCookieOptions } from "./shared-cookie-options";

/** Merge shared Domain/path with Supabase-provided options for Set-Cookie on Edge/Node. */
export function forNextResponseCookie(options: CookieOptions): CookieOptions {
  const d = supabaseSharedCookieOptions();
  return forNextSetCookie(d ? { ...options, ...d } : options);
}
