import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const userId = searchParams.get("state");

    if (!code || !userId) {
      return NextResponse.json({ error: "Missing authorization code or state." }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let tokens: Record<string, unknown> = {};

    if (code === "mock-auth-code") {
      tokens = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_in: 3600,
        expiry_date: Date.now() + 3600 * 1000,
      };
    } else {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`;

      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId || "",
          client_secret: clientSecret || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error_description || "Token exchange failed");
      }

      const body = await res.json();
      tokens = {
        access_token: body.access_token,
        refresh_token: body.refresh_token || null,
        expires_in: body.expires_in,
        expiry_date: Date.now() + body.expires_in * 1000,
      };
    }

    // Update user profile with connection state
    const { error } = await admin
      .from("users")
      .update({
        google_calendar_connected: true,
        google_calendar_tokens: tokens,
      })
      .eq("id", userId);

    if (error) {
      console.error("[Google Calendar Callback] Database save error:", error);
      return NextResponse.json({ error: "Failed to save connection in database." }, { status: 500 });
    }

    return NextResponse.redirect(`${appUrl}/tools?google_calendar=connected`);
  } catch (err) {
    const error = err as Error;
    console.error("[Google Calendar Callback] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to complete authentication." }, { status: 500 });
  }
}
