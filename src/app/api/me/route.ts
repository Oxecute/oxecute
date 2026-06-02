import { logEvent } from "@/lib/analytics";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z
  .object({
    stage: z.string().optional(),
    mrr: z.string().optional(),
    startup_name: z.string().min(1).max(200).optional(),
    full_name: z.string().min(1).max(200).optional(),
    first_name: z.string().max(120).optional(),
    last_name: z.string().max(120).optional(),
    startup_description: z.string().min(50).max(500).optional(),
    cal_q1_shipped: z.string().max(250).optional(),
    cal_q2_customers: z.string().max(250).optional(),
    cal_q3_didnt_work: z.string().max(250).optional(),
    cal_q4_traction: z.string().max(250).optional(),
    cal_q5_unknown: z.string().max(250).optional(),
    calibration_locked: z.boolean().optional(),
    calibration_synthesis: z.array(z.string()).min(1).max(10).optional(),
    blocker_text: z.string().max(140).optional(),
    avoidance_tags: z.array(z.string()).optional(),
    conexa_day1_report: z.unknown().optional(),
    conexa_day1_at: z.string().optional(),
    username: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{3,20}$/)
      .optional(),
    profile_public: z.boolean().optional(),
    profile_bio: z.string().max(160).nullish(),
    show_breaks: z.boolean().optional(),
    show_signal_score: z.boolean().optional(),
    day21_unlocked: z.boolean().optional(),
    github_repo: z.string().max(250).nullish(),
    github_branch: z.string().max(100).nullish(),
  })
  .strict();

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createServiceRoleClient();
  const { data, error } = await admin.from("users").select("*").eq("id", user.id).single();
  if (error || !data) {
    return NextResponse.json(
      {
        error: "Not found",
        auth_email: user.email ?? null,
        user_metadata: user.user_metadata ?? {},
      },
      { status: 404 },
    );
  }
  const { count: inboxUnread } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);
  return NextResponse.json({ user: data, inbox_unread: inboxUnread ?? 0 });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: row } = await admin.from("users").select("*").eq("id", user.id).single();
  if (!row) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const p = parsed.data;

  if (p.username && p.username !== row.username) {
    const locked =
      !!row.username_locked_at ||
      (row.created_at &&
        Date.now() - new Date(row.created_at as string).getTime() >
          7 * 86400000);
    if (locked) {
      return NextResponse.json({ error: "Username locked" }, { status: 403 });
    }
    const { data: clash } = await admin
      .from("users")
      .select("id")
      .eq("username", p.username)
      .neq("id", user.id)
      .maybeSingle();
    if (clash) {
      return NextResponse.json({ error: "Username taken" }, { status: 409 });
    }
  }

  const updates: Record<string, unknown> = { ...p };

  if (p.first_name !== undefined || p.last_name !== undefined) {
    const rowFirst = String((row as { first_name?: string | null }).first_name ?? "").trim();
    const rowLast = String((row as { last_name?: string | null }).last_name ?? "").trim();
    const nextFirst =
      p.first_name !== undefined ? p.first_name.trim() : rowFirst;
    const nextLast = p.last_name !== undefined ? p.last_name.trim() : rowLast;
    const merged = `${nextFirst} ${nextLast}`.trim();
    if (merged) updates.full_name = merged;
  }

  if (p.calibration_locked === false) {
    if (row.conexa_day1_at) {
      return NextResponse.json(
        {
          error:
            "Conexa calibration can't be reopened after your Day 1 Conexa report is saved.",
        },
        { status: 403 },
      );
    }
    updates.calibration_synthesis = null;
  }

  const { error } = await admin.from("users").update(updates).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (p.conexa_day1_report && typeof p.conexa_day1_report === "object") {
    const { data: existingBaseline } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", "Conexa has read your baseline")
      .limit(1)
      .maybeSingle();
    if (!existingBaseline) {
      const rep = p.conexa_day1_report as { personal_insight?: string };
      await admin.from("notifications").insert({
        user_id: user.id,
        type: "system",
        title: "Conexa has read your baseline",
        body: rep.personal_insight ?? "",
      });
    }
  }

  if (p.stage && p.mrr && p.startup_description) {
    await logEvent(
      "context_captured",
      {
        stage: p.stage,
        mrr: p.mrr,
        description_length: p.startup_description.length,
      },
      user.id,
      "web",
    );
  }

  return NextResponse.json({ ok: true });
}
