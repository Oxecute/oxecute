import type { CookieOptions } from "@supabase/ssr";

function isValidSameSite(
  v: unknown,
): v is boolean | "lax" | "strict" | "none" | "unspecified" {
  if (typeof v === "boolean") return true;
  if (typeof v !== "string") return false;
  const s = v.toLowerCase();
  return s === "lax" || s === "strict" || s === "none" || s === "unspecified";
}

/** Keep only fields Next.js cookie serialization accepts; avoid throwing in middleware set(). */
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
  if (path !== undefined && typeof path === "string") out.path = path;
  if (maxAge !== undefined && typeof maxAge === "number" && Number.isFinite(maxAge)) {
    out.maxAge = maxAge;
  }
  if (domain !== undefined && typeof domain === "string") out.domain = domain;
  if (httpOnly !== undefined && typeof httpOnly === "boolean") out.httpOnly = httpOnly;
  if (secure !== undefined && typeof secure === "boolean") out.secure = secure;
  if (sameSite !== undefined && isValidSameSite(sameSite)) out.sameSite = sameSite;
  if (expires instanceof Date && !Number.isNaN(expires.getTime())) out.expires = expires;
  if (partitioned !== undefined && typeof partitioned === "boolean") out.partitioned = partitioned;
  if (priority !== undefined && typeof priority === "string") out.priority = priority;
  return out;
}
