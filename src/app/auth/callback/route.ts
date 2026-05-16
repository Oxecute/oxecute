import { authDebug } from "@/lib/auth/debug";
import { forNextResponseCookie } from "@/lib/supabase/merge-response-cookie";
import { supabaseSharedCookieOptionsForHost } from "@/lib/supabase/shared-cookie-options";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function sanitizeNextPath(path: string | null, fallback: string): string {
  const fb = fallback.startsWith("/") ? fallback : `/${fallback}`;
  if (!path) return fb;
  const p = path.trim();
  if (!p.startsWith("/") || p.startsWith("//") || p.includes(":")) return fb;
  return p;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;
  const cookieStore = await cookies();
  const pwResetIntent = cookieStore.get("oxecute_pw_reset_intent")?.value === "1";
  const nextParam = searchParams.get("next");
  const nextRaw = sanitizeNextPath(
    nextParam,
    pwResetIntent ? "/auth/update-password" : "/start",
  );
  const next = nextRaw.startsWith("/") ? nextRaw : `/${nextRaw}`;

  const oauthErr = searchParams.get("error");
  const oauthDesc = searchParams.get("error_description");
  if (oauthErr) {
    const msg = (oauthDesc || oauthErr).replace(/\+/g, " ");
    authDebug("oauth error from provider", { msg: msg.slice(0, 120) });
    return NextResponse.redirect(
      `${origin}/login?auth_error=${encodeURIComponent(msg)}`,
    );
  }

  const code = searchParams.get("code");
  if (!code) {
    authDebug("oauth callback missing code");
    return NextResponse.redirect(
      `${origin}/login?auth_error=${encodeURIComponent(
        "No sign-in code returned. Check Supabase Redirect URLs include this site’s /auth/callback and Site URL matches the app you opened.",
      )}`,
    );
  }

  const redirectTarget = `${origin}${next}`;

  /** Must exist before exchangeCodeForSession so setAll can attach Set-Cookie to this response. */
  const response = NextResponse.redirect(redirectTarget);

  const sharedCookies = supabaseSharedCookieOptionsForHost(url.hostname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(sharedCookies ? { cookieOptions: sharedCookies } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
          headers: Record<string, string>,
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              forNextResponseCookie(options, url.hostname),
            );
          });
          Object.entries(headers ?? {}).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    authDebug("exchangeCodeForSession failed", { message: error.message });
    return NextResponse.redirect(
      `${origin}/login?auth_error=${encodeURIComponent(error.message)}`,
    );
  }

  authDebug("oauth session established", { next });

  response.cookies.delete("oxecute_pw_reset_intent");
  return response;
}
