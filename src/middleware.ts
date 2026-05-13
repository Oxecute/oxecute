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

export async function middleware(request: NextRequest) {
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
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = baseResponse(request, rewriteTo);
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = baseResponse(request, rewriteTo);
          response.cookies.set({ name, value: "", ...options });
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
