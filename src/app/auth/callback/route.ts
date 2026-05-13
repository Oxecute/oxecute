import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getPublicOriginFromRequest } from "@/lib/http/public-origin";
import { forNextSetCookie } from "@/lib/supabase/for-next-cookie";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const origin = getPublicOriginFromRequest(request);
  const cookieStore = await cookies();
  const pwResetIntent = cookieStore.get("oxecute_pw_reset_intent")?.value === "1";
  const nextParam = searchParams.get("next");
  const nextTrimmed = nextParam?.trim() ?? "";
  const nextRaw =
    nextTrimmed.length > 0
      ? nextTrimmed
      : pwResetIntent
        ? "/auth/update-password"
        : "/start";
  const next = nextRaw.startsWith("/") ? nextRaw : `/${nextRaw}`;

  const oauthErr = searchParams.get("error");
  const oauthDesc = searchParams.get("error_description");
  if (oauthErr) {
    const msg = (oauthDesc || oauthErr).replace(/\+/g, " ");
    return NextResponse.redirect(
      `${origin}/login?auth_error=${encodeURIComponent(msg)}`,
    );
  }

  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?auth_error=${encodeURIComponent(
        "No sign-in code returned. Check Supabase Redirect URLs include this site’s /auth/callback and Site URL matches the app you opened.",
      )}`,
    );
  }

  const redirectTarget = `${origin}${next}`;

  /** Must exist before exchangeCodeForSession so setAll can attach Set-Cookie to this response. */
  const response = NextResponse.redirect(redirectTarget);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
          headers: Record<string, string>,
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const o = forNextSetCookie(options);
            response.cookies.set(name, value, o);
          });
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?auth_error=${encodeURIComponent(error.message)}`,
    );
  }

  response.cookies.delete("oxecute_pw_reset_intent");
  return response;
}
