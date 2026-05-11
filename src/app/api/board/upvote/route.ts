import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ request_id: z.string().uuid() }).strict();

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from("users")
    .select("day7_reached, execution_count")
    .eq("id", user.id)
    .single();

  if (!profile?.day7_reached) {
    return NextResponse.json(
      {
        error: "Upvotes unlock after 7 days executed on your record.",
      },
      { status: 403 },
    );
  }

  const requestId = parsed.data.request_id;
  const execCount = Number(profile.execution_count ?? 0);

  const { data: existing } = await admin
    .from("feature_request_upvotes")
    .select("id")
    .eq("request_id", requestId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, already: true });
  }

  const { error: insErr } = await admin.from("feature_request_upvotes").insert({
    request_id: requestId,
    user_id: user.id,
    user_execution_count: execCount,
  });

  if (insErr) {
    if (insErr.code === "23505") {
      return NextResponse.json({ ok: true, already: true });
    }
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  const { data: fr } = await admin
    .from("feature_requests")
    .select("upvote_count")
    .eq("id", requestId)
    .single();

  const next = Number(fr?.upvote_count ?? 0) + 1;
  const { error: upErr } = await admin
    .from("feature_requests")
    .update({ upvote_count: next })
    .eq("id", requestId);

  if (upErr) {
    await admin.from("feature_request_upvotes").delete().eq("request_id", requestId).eq("user_id", user.id);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
