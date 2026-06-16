import { authDebug } from "@/lib/auth/debug";
import { forNextResponseCookie } from "@/lib/supabase/merge-response-cookie";
import { supabaseSharedCookieOptionsForHost } from "@/lib/supabase/shared-cookie-options";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Single-segment paths that must not be treated as public usernames (see app/u/[username]). */
const ROOT_APP_SEGMENTS = new Set([
  "api",
  "auth",
  "dashboard",
  "login",
  "signup",
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

/**
 * Supabase sometimes sends users to Site URL root (`/?code=`) instead of `/auth/callback`.
 * Keep the **same hostname** as the request — do not rewrite www↔apex here, or you can fight
 * Vercel "redirect www/apex" settings and get ERR_TOO_MANY_REDIRECTS.
 */
function redirectAuthCodeFromRoot(request: NextRequest): NextResponse | null {
  const url = request.nextUrl;
  if (url.pathname !== "/" || !url.searchParams.has("code")) {
    return null;
  }

  const out = new URL(url.toString());
  out.pathname = "/auth/callback";

  authDebug("oauth: ?code on / redirected to /auth/callback", {
    host: out.hostname,
  });
  return NextResponse.redirect(out, 307);
}

export async function middleware(request: NextRequest) {
  const rootAuthRedirect = redirectAuthCodeFromRoot(request);
  if (rootAuthRedirect) return rootAuthRedirect;

  const { pathname: rawPath } = request.nextUrl;
  const pathname =
    rawPath.length > 1 && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath;

  if (pathname.toLowerCase() === "/signup") {
    const startUrl = new URL("/start", request.url);
    startUrl.search = request.nextUrl.search;
    return NextResponse.redirect(startUrl, 307);
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
    const res = NextResponse.next({ request: { headers: request.headers } });
    if (request.nextUrl.hostname === "individual-amber-wsbkearolg.edgeone.app") {
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return res;
  }

  const segments = pathname.split("/").filter(Boolean);
  const rewriteTo =
    segments.length === 1 && !ROOT_APP_SEGMENTS.has(segments[0]!.toLowerCase())
      ? new URL(`/u${pathname}`, request.url)
      : null;

  let response = baseResponse(request, rewriteTo);

  const sharedCookies = supabaseSharedCookieOptionsForHost(
    request.nextUrl.hostname,
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(sharedCookies ? { cookieOptions: sharedCookies } : {}),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
          headers: Record<string, string>,
        ) {
          response = baseResponse(request, rewriteTo);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              forNextResponseCookie(options, request.nextUrl.hostname),
            );
          });
          Object.entries(headers ?? {}).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  if (request.nextUrl.hostname === "individual-amber-wsbkearolg.edgeone.app") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
