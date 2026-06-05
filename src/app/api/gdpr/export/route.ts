import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
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

    const admin = createServiceRoleClient();

    // Fetch user profile
    const { data: profile, error: profileErr } = await admin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    // Fetch entries, break marks, directives, milestones
    const [entriesRes, breaksRes, directivesRes, milestonesRes] = await Promise.all([
      admin.from("entries").select("*").eq("user_id", user.id),
      admin.from("break_marks").select("*").eq("user_id", user.id),
      admin.from("directives").select("*").eq("user_id", user.id),
      admin.from("milestone_events").select("*").eq("user_id", user.id),
    ]);

    const archive = {
      exported_at: new Date().toISOString(),
      profile: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        country: profile.country,
        startup_name: profile.startup_name,
        startup_description: profile.startup_description,
        created_at: profile.created_at,
        execution_count: profile.execution_count,
        break_count: profile.break_count,
        days_on_record: profile.days_on_record,
        last_submission_date: profile.last_submission_date,
        tier: profile.tier,
      },
      ledger_entries: entriesRes.data || [],
      break_marks: breaksRes.data || [],
      directives: directivesRes.data || [],
      milestone_events: milestonesRes.data || [],
    };

    return NextResponse.json(archive);
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Export failed." }, { status: 500 });
  }
}
