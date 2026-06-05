import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceRoleClient();
  const { data: directives, error } = await admin
    .from("directives")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const active = directives.find((d) => d.status === "open");
  const history = directives.filter((d) => d.status !== "open");

  const issued = directives.length;
  const completed = directives.filter((d) => d.status === "completed").length;
  const missed = directives.filter((d) => d.status === "missed").length;
  const completionRate = issued > 0 ? Math.round((completed / issued) * 100) : 0;

  return NextResponse.json({
    active: active || null,
    history,
    stats: {
      issued,
      completed,
      missed,
      completion_rate: completionRate,
    },
  });
}
