import { conexaSynthesis } from "@/lib/conexa/anthropic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceRoleClient();
  const { data: u } = await admin
    .from("users")
    .select(
      "calibration_locked, calibration_synthesis, cal_q1_shipped, cal_q2_customers, cal_q3_didnt_work, cal_q4_traction, cal_q5_unknown",
    )
    .eq("id", user.id)
    .single();

  if (!u) return NextResponse.json({ error: "No user" }, { status: 404 });

  if (u.calibration_locked && u.calibration_synthesis) {
    const stmts = u.calibration_synthesis as string[];
    return NextResponse.json({ statements: stmts, cached: true });
  }

  const userMsg = `Q1 (What they shipped): "${u.cal_q1_shipped ?? ""}"
Q2 (Customer conversations): "${u.cal_q2_customers ?? ""}"
Q3 (What didn't work): "${u.cal_q3_didnt_work ?? ""}"
Q4 (Early traction): "${u.cal_q4_traction ?? ""}"
Q5 (30-day unknown): "${u.cal_q5_unknown ?? ""}"`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12000);
  let text: string;
  let tokens_in = 0;
  let tokens_out = 0;
  let latency_ms = 0;
  try {
    const r = await conexaSynthesis(userMsg, controller.signal);
    text = r.text;
    tokens_in = r.tokens_in;
    tokens_out = r.tokens_out;
    latency_ms = r.latency_ms;
  } catch {
    clearTimeout(t);
    const fallback = [
      `Q1 read: ${(u.cal_q1_shipped || "empty").slice(0, 120)}`,
      `Q2 read: ${(u.cal_q2_customers || "empty").slice(0, 120)}`,
      `Q3 read: ${(u.cal_q3_didnt_work || "empty").slice(0, 120)}`,
      `Q4 read: ${(u.cal_q4_traction || "empty").slice(0, 120)}`,
      `Q5 read: ${(u.cal_q5_unknown || "empty").slice(0, 120)}`,
    ];
    return NextResponse.json({ statements: fallback, fallback: true });
  }
  clearTimeout(t);

  let statements: string[] = [];
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length === 5) {
      statements = parsed.map(String);
    }
  } catch {
    statements = cleaned
      .split("\n")
      .map((s) => s.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 5);
    while (statements.length < 5) {
      statements.push("More context needed. Keep building your record.");
    }
  }

  return NextResponse.json({
    statements,
    cached: false,
    tokens_in,
    tokens_out,
    latency_ms,
  });
}
