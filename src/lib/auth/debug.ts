/** Enable with `AUTH_DEBUG=1` (server) or `NEXT_PUBLIC_AUTH_DEBUG=1` (client + server). Do not set in production unless troubleshooting. */
export function authDebug(message: string, data?: Record<string, unknown>): void {
  const on =
    process.env.AUTH_DEBUG === "1" || process.env.NEXT_PUBLIC_AUTH_DEBUG === "1";
  if (!on) return;
  if (data && Object.keys(data).length > 0) {
    console.log(`[oxecute-auth] ${message}`, data);
  } else {
    console.log(`[oxecute-auth] ${message}`);
  }
}
