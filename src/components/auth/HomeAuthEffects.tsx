"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

/**
 * Backup for OAuth landing on `/` with ?code= (middleware should redirect first).
 * If already signed in, skip marketing and continue at /start (resolveAuth → dashboard).
 */
export function HomeAuthEffects() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { pathname, search } = window.location;
    if (pathname !== "/") return;

    const sp = new URLSearchParams(search);
    const hasCode = sp.has("code");
    const err = sp.get("error");
    const oauthErr =
      err != null &&
      (sp.has("state") || sp.has("error_description") || err === "access_denied");
    if (hasCode || oauthErr) {
      window.location.replace(`/auth/callback${search}`);
      return;
    }

    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) window.location.replace("/start");
    });
  }, []);

  return null;
}
