import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;
  const cookieStore = await cookies();
  const pwResetIntent = cookieStore.get("oxecute_pw_reset_intent")?.value === "1";
  const nextParam = searchParams.get("next");
  const nextRaw =
    nextParam ??
    (pwResetIntent ? "/auth/update-password" : "/start");
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
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

  const res = NextResponse.redirect(`${origin}${next}`);
  res.cookies.delete("oxecute_pw_reset_intent");
  return res;
}
