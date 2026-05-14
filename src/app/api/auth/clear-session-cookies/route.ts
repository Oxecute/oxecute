import { forNextResponseCookie } from "@/lib/supabase/merge-response-cookie";
import { supabaseSharedCookieOptions } from "@/lib/supabase/shared-cookie-options";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Drops all `sb-*` cookies from the incoming request (host-only and shared Domain, when configured).
 * Paired with middleware bypass so `getUser()` does not immediately refresh session cookies on this request.
 */
export async function POST() {
  const cookieStore = await cookies();
  const shared = supabaseSharedCookieOptions();
  const res = NextResponse.json({ ok: true });

  for (const { name } of cookieStore.getAll()) {
    if (!name.startsWith("sb-")) continue;
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
    if (shared?.domain) {
      res.cookies.set(
        name,
        "",
        forNextResponseCookie({
          path: "/",
          maxAge: 0,
          domain: shared.domain,
          secure: shared.secure,
          sameSite: shared.sameSite,
        }),
      );
    }
  }

  return res;
}
