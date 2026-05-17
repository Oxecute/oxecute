"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Clears Supabase auth cookies (server) + local client session, then hard-navigates.
 * Use when mobile browsers keep stale `sb-*` cookies (often: works in incognito, fails in normal profile).
 */
export async function resetAuthCookiesAndReload(redirectPath = "/login") {
  try {
    await fetch("/api/auth/clear-session-cookies", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    /* still attempt local sign-out */
  }
  try {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    /* ignore */
  }
  const path = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  window.location.assign(path);
}
