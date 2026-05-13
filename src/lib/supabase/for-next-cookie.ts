import type { CookieOptions } from "@supabase/ssr";

/** Keep only attributes Next.js / Edge cookie serialization understands (avoids stray `cookie` package fields). */
export function forNextSetCookie(
  options: CookieOptions | undefined,
): CookieOptions {
  if (!options) return {};
  const o = options as Record<string, unknown>;
  const out: CookieOptions = {};
  if (typeof o.path === "string") out.path = o.path;
  if (typeof o.maxAge === "number") out.maxAge = o.maxAge;
  if (typeof o.domain === "string") out.domain = o.domain;
  if (typeof o.httpOnly === "boolean") out.httpOnly = o.httpOnly;
  if (typeof o.secure === "boolean") out.secure = o.secure;
  if (typeof o.sameSite === "boolean" || typeof o.sameSite === "string") {
    out.sameSite = o.sameSite as CookieOptions["sameSite"];
  }
  if (o.expires instanceof Date) out.expires = o.expires;
  if (typeof o.partitioned === "boolean") out.partitioned = o.partitioned;
  if (typeof o.priority === "string")
    out.priority = o.priority as CookieOptions["priority"];
  return out;
}
