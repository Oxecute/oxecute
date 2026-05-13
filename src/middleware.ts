import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { forNextSetCookie } from "@/lib/supabase/for-next-cookie";
import { NextResponse, type NextRequest } from "next/server";

/** Single-segment paths that must not be treated as public usernames (see app/u/[username]). */
const ROOT_APP_SEGMENTS = new Set([
  "api",
  "auth",
  "dashboard",
  "login",
  "start",
  "board",
  "inbox",
  "tools",
  "settings",
  "signal",
  "directive",
  "community",
  "coaches",
  "angels",
  "fonts",
  "_next",
  "favicon.ico",
]);

function baseResponse(request: NextRequest, rewriteTo: URL | null) {
  if (rewriteTo) {
    return NextResponse.rewrite(rewriteTo);
  }
  return NextResponse.next({ request: { headers: request.headers } });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /** Supabase Site URL is often `/`; OAuth may return there with ?code= instead of /auth/callback. */
  if (pathname === "/") {
    const sp = request.nextUrl.searchParams;
    if (sp.has("code")) {
      const dest = request.nextUrl.clone();
      dest.pathname = "/auth/callback";
      return NextResponse.redirect(dest);
    }
    const err = sp.get("error");
    if (
      err != null &&
      (sp.has("state") ||
        sp.has("error_description") ||
        err === "access_denied")
    ) {
      const dest = request.nextUrl.clone();
      dest.pathname = "/auth/callback";
      return NextResponse.redirect(dest);
    }
  }

  /**
   * Do not refresh Supabase session here: it races PKCE `exchangeCodeForSession`
   * in the route handler and breaks mobile Google OAuth (redirect errors / loops).
   */
  if (
    pathname === "/auth/callback" ||
    pathname.startsWith("/auth/callback/")
  ) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const segments = pathname.split("/").filter(Boolean);
  const rewriteTo =
    segments.length === 1 && !ROOT_APP_SEGMENTS.has(segments[0]!.toLowerCase())
      ? new URL(`/u${pathname}`, request.url)
      : null;

  let response = baseResponse(request, rewriteTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
          headers: Record<string, string>,
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const o = forNextSetCookie(options);
            request.cookies.set({ name, value, ...o });
          });
          response = baseResponse(request, rewriteTo);
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

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
