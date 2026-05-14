/**
 * OAuth PKCE must finish in `/auth/callback` (server `exchangeCodeForSession`).
 * If Supabase sends `?code=` to `/login` or `/start`, the browser client can corrupt
 * flow state — send the user to the callback route with the same query (+ hash).
 */
export function redirectOAuthCodeToCallbackIfNeeded(): void {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  if (!p.has("code")) return;
  if (window.location.pathname === "/auth/callback") return;
  if (p.get("auth_error")) return;
  window.location.replace(
    `/auth/callback${window.location.search}${window.location.hash}`,
  );
}
