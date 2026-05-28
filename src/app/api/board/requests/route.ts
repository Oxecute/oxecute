import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { z } from "zod";

/** Seeded rows use null submitter; show distinct demo founders in the board UI. */
const DEMO_SUBMITTER_BY_TITLE: Record<string, string> = {
  "Backfill Execution Record": "Abhi R, India",
  "Conexa Context Refresh": "Emily Blundell, UK",
  "Weekly Execution Summary Email": "Norris Blake, USA",
};

const postBodySchema = z
  .object({
    title: z.string().min(5).max(100),
    description: z.string().min(20).max(1000),
    category: z.enum(["integration", "feature", "ui", "bug", "other"]),
  })
  .strict();

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

  let submitterMap: Record<string, { username: string; execution_count: number; days_on_record: number }> = {};
  if (submitterIds.length) {
    const { data: users } = await admin
      .from("users")
      .select("id, username, execution_count, days_on_record")
      .in("id", submitterIds);
    submitterMap = Object.fromEntries(
      (users ?? []).map((u) => [
        u.id as string,
        {
          username: u.username as string,
          execution_count: Number(u.execution_count ?? 0),
          days_on_record: Number(u.days_on_record ?? 0),
        },
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
        ? "Oxecute Team"
        : `Day ${sub.days_on_record} founder · ${sub.execution_count} days executed`);
    return {
      ...r,
      submitter_label: submitterLabel,
      upvoted: mySet.has(r.id as string),
    };
  });

  return NextResponse.json({ requests: enriched });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = postBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from("users")
    .select("day21_reached")
    .eq("id", user.id)
    .single();

  if (!profile?.day21_reached) {
    return NextResponse.json(
      { error: "New requests unlock after 21 days executed on your record." },
      { status: 403 },
    );
  }

  const { error: insErr } = await admin.from("feature_requests").insert({
    submitter_user_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    status: "pending",
    upvote_count: 0,
    comment_count: 0,
  });

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
