import { authDebug } from "@/lib/auth/debug";
import { forNextSetCookie } from "@/lib/supabase/for-next-cookie";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
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

/**
 * Supabase sometimes sends users to Site URL root (`/?code=`) instead of `/auth/callback`.
 * Without this, `exchangeCodeForSession` never runs and the console can show chrome-error frames.
 */
function redirectAuthCodeFromRoot(request: NextRequest): NextResponse | null {
  const url = request.nextUrl;
  if (url.pathname !== "/" || !url.searchParams.has("code")) {
    return null;
  }

  const out = new URL(url.toString());
  out.pathname = "/auth/callback";

  const siteRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const host = url.hostname;
  if (
    siteRaw &&
    host !== "localhost" &&
    host !== "127.0.0.1" &&
    !host.endsWith(".vercel.app")
  ) {
    try {
      const canonical = new URL(siteRaw);
      out.hostname = canonical.hostname;
      out.protocol = canonical.protocol;
    } catch {
      /* keep request host */
    }
  }

  authDebug("oauth: ?code on / redirected to /auth/callback", {
    host: out.hostname,
  });
  return NextResponse.redirect(out, 308);
}

export async function middleware(request: NextRequest) {
  const rootAuthRedirect = redirectAuthCodeFromRoot(request);
  if (rootAuthRedirect) return rootAuthRedirect;

  const host = request.nextUrl.hostname;

  /** Force apex / canonical host in production (set NEXT_PUBLIC_SITE_URL=https://oxecute.com on Vercel). */
  const siteRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (
    siteRaw &&
    host !== "localhost" &&
    host !== "127.0.0.1" &&
    !host.endsWith(".vercel.app")
  ) {
    try {
      const canonical = new URL(siteRaw);
      if (canonical.hostname !== host) {
        const url = request.nextUrl.clone();
        url.hostname = canonical.hostname;
        url.protocol = canonical.protocol;
        authDebug("redirect to canonical host", {
          from: host,
          to: canonical.hostname,
        });
        return NextResponse.redirect(url, 308);
      }
    } catch {
      /* ignore invalid NEXT_PUBLIC_SITE_URL */
    }
  }

  const { pathname } = request.nextUrl;
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
            response.cookies.set(name, value, forNextSetCookie(options));
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
