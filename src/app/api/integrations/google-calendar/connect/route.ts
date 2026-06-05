import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`;

    // Simulated flow for testing if no environment credentials
    if (!clientId || clientId === "your-google-client-id") {
      const mockCallbackUrl = `${appUrl}/api/integrations/google-calendar/callback?code=mock-auth-code&state=${user.id}`;
      return NextResponse.redirect(mockCallbackUrl);
    }

    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email"
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${user.id}`;

    return NextResponse.redirect(authUrl);
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Failed to start connection." }, { status: 500 });
  }
}
