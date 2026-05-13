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
  try {
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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      console.error(
        "[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — skipping session refresh.",
      );
      return response;
    }

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
          headers: Record<string, string>,
        ) {
          try {
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
          } catch (e) {
            console.error("[middleware] cookie setAll failed", e);
          }
        },
      },
    });

    await supabase.auth.getUser();

    return response;
  } catch (e) {
    console.error("[middleware] unhandled error", e);
    return NextResponse.next({ request: { headers: request.headers } });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
