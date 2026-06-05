import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createServiceRoleClient();
    const anonId = nanoid(10).toLowerCase();
    const anonymousEmail = `erased-${anonId}@anonymous.oxecute.com`;
    const anonymousUsername = `anonymous_${anonId}`;

    // 1. Update auth.users to change email and scramble password/provider info
    const { error: authErr } = await admin.auth.admin.updateUserById(user.id, {
      email: anonymousEmail,
      password: crypto.randomBytes(32).toString("hex"),
      user_metadata: {},
    });

    if (authErr) {
      console.error("[GDPR Erase] Auth update error:", authErr);
      return NextResponse.json({ error: "Failed to erase auth credentials." }, { status: 500 });
    }

    // 2. Redact profile details from public.users
    const { error: profileErr } = await admin
      .from("users")
      .update({
        email: anonymousEmail,
        username: anonymousUsername,
        full_name: "Anonymous Operator",
        first_name: "Anonymous",
        last_name: "Operator",
        startup_name: "Anonymous Startup",
        startup_description: "Anonymous startup description.",
        profile_bio: null,
        profile_public: false, // Deindexes from public views
        google_calendar_connected: false,
        google_calendar_tokens: null,
        github_repo: null,
        github_branch: "main",
        conexa_day1_report: null,
        conexa_day14_read: null,
      })
      .eq("id", user.id);

    if (profileErr) {
      console.error("[GDPR Erase] Profile update error:", profileErr);
      return NextResponse.json({ error: "Failed to redact profile info." }, { status: 500 });
    }

    // 3. Clear sensitive Conexa message history
    await admin.from("conexa_messages").delete().eq("user_id", user.id);

    // 4. Sign out / Clear session on the client side
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true, message: "GDPR Erasure complete. All identifiers redacted." });
  } catch (err) {
    const error = err as Error;
    console.error("[GDPR Erase] Exception:", error);
    return NextResponse.json({ error: error.message || "Erasure failed." }, { status: 500 });
  }
}
