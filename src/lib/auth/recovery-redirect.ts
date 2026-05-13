/** Where Supabase sends users after password recovery link (must match Supabase Redirect URLs). */
export function passwordRecoveryCallbackUrl(): string {
  if (typeof window === "undefined") return "";
  const next = encodeURIComponent("/auth/update-password");
  return `${window.location.origin}/auth/callback?next=${next}`;
}
