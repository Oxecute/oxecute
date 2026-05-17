import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

/** Seeded rows use null submitter; show distinct demo founders in the board UI. */
const DEMO_SUBMITTER_BY_TITLE: Record<string, string> = {
  "Backfill Execution Record": "Abhi R, India",
  "Conexa Context Refresh": "Emily Blundell, UK",
  "Weekly Execution Summary Email": "Norris Blake, USA",
};

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceRoleClient();
  const { data: requests, error: reqErr } = await admin
    .from("feature_requests")
    .select(
      "id, title, description, category, status, upvote_count, comment_count, created_at, submitter_user_id",
    )
    .order("upvote_count", { ascending: false });

  if (reqErr) {
    return NextResponse.json({ error: reqErr.message }, { status: 500 });
  }

  const submitterIds = Array.from(
    new Set(
      (requests ?? [])
        .map((r) => r.submitter_user_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  let submitterMap: Record<string, { username: string; execution_count: number }> = {};
  if (submitterIds.length) {
    const { data: users } = await admin
      .from("users")
      .select("id, username, execution_count")
      .in("id", submitterIds);
    submitterMap = Object.fromEntries(
      (users ?? []).map((u) => [
        u.id as string,
        { username: u.username as string, execution_count: Number(u.execution_count ?? 0) },
      ]),
    );
  }

  const { data: myUpvotes } = await admin
    .from("feature_request_upvotes")
    .select("request_id")
    .eq("user_id", user.id);

  const mySet = new Set((myUpvotes ?? []).map((u) => u.request_id as string));

  const enriched = (requests ?? []).map((r) => {
    const sid = r.submitter_user_id as string | null;
    const sub = sid ? submitterMap[sid] : null;
    const titleStr = String(r.title ?? "");
    const demoLabel = DEMO_SUBMITTER_BY_TITLE[titleStr];
    const submitterLabel =
      demoLabel ??
      (!sid || !sub
        ? "North River Labs"
        : `Day ${sub.execution_count} · @${sub.username}`);
    return {
      ...r,
      submitter_label: submitterLabel,
      upvoted: mySet.has(r.id as string),
    };
  });

  return NextResponse.json({ requests: enriched });
}
