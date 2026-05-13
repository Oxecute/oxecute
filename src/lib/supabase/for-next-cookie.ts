import type { CookieOptions } from "@supabase/ssr";

/** Keep only fields Next.js cookie serialization uses; drops `encode` etc. from the `cookie` package. */
export function forNextSetCookie(options: CookieOptions | undefined): CookieOptions {
  if (!options) return {};
  const {
    path,
    maxAge,
    domain,
    httpOnly,
    secure,
    sameSite,
    expires,
    partitioned,
    priority,
  } = options;
  const out: CookieOptions = {};
  if (path !== undefined) out.path = path;
  if (maxAge !== undefined) out.maxAge = maxAge;
  if (domain !== undefined) out.domain = domain;
  if (httpOnly !== undefined) out.httpOnly = httpOnly;
  if (secure !== undefined) out.secure = secure;
  if (sameSite !== undefined) out.sameSite = sameSite;
  if (expires !== undefined) out.expires = expires;
  if (partitioned !== undefined) out.partitioned = partitioned;
  if (priority !== undefined) out.priority = priority;
  return out;
}
