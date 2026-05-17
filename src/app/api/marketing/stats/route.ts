import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public marketing counters for the landing ticker + CTA (brief May 2026).
 * Uses service role; falls back to brief defaults if DB unavailable.
 */
export async function GET() {
  try {
    const admin = createServiceRoleClient();
    const [{ count: userCount }, { count: waitlistCount }, { data: userRows }] =
      await Promise.all([
        admin.from("users").select("*", { head: true, count: "exact" }),
        admin.from("waitlist_signups").select("*", { head: true, count: "exact" }),
        admin.from("users").select("country"),
      ]);

    const users = userCount ?? 0;
    const waitlisted = waitlistCount ?? 0;
    const combined = users + waitlisted;

    const distinctCountries = new Set(
      (userRows ?? [])
        .map((r) => String((r as { country?: string | null }).country ?? "").trim())
        .filter(Boolean),
    ).size;

    return NextResponse.json({
      founders: combined > 0 ? combined : 128,
      countries: distinctCountries > 0 ? distinctCountries : 12,
      spotsRemaining: 72,
    });
  } catch {
    return NextResponse.json({
      founders: 128,
      countries: 12,
      spotsRemaining: 72,
    });
  }
}
