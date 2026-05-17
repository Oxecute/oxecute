import { clampConexaPersonalInsight, clampConexaTabBody } from "@/lib/conexa/format-conexa-output";
import { parseActivationResponse } from "@/lib/conexa/prompts";
import { conexaActivation } from "@/lib/conexa/anthropic";
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
  const { data: u } = await admin.from("users").select("*").eq("id", user.id).single();
  if (!u) return NextResponse.json({ error: "No user" }, { status: 404 });

  const fullName = String(u.full_name ?? "").split(" ")[0] || "founder";
  // Calibration Q2/Q3 in UX map to cal_q3_didnt_work / cal_q5_unknown in DB (see initial schema).
  const fields = {
    startup_name: u.startup_name,
    stage: u.stage,
    mrr: u.mrr,
    startup_description: u.startup_description,
    cal_q1_shipped: u.cal_q1_shipped ?? "",
    cal_q2_avoidance: u.cal_q3_didnt_work ?? "",
    cal_q3_success: u.cal_q5_unknown ?? "",
    blocker_text: u.blocker_text ?? "",
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 120000);

  let fullText: string;
  let tokens_in = 0;
  let tokens_out = 0;
  let latency_ms = 0;
  try {
    const r = await conexaActivation(fields, controller.signal);
    fullText = r.text;
    tokens_in = r.tokens_in;
    tokens_out = r.tokens_out;
    latency_ms = r.latency_ms;
  } catch {
    clearTimeout(t);
    const fallbackInsight = `Conexa has read your baseline, ${fullName}. Your execution window opens at midnight.`;
    const tabMsg =
      "Conexa could not finish this read (network, API key, or timeout). Your answers are saved - try again in a moment. If it persists, confirm ANTHROPIC_API_KEY in your server environment.";
    return NextResponse.json({
      tabs: {
        reality_check: tabMsg,
        blindspot: tabMsg,
        shipping_vs_noise: tabMsg,
        next_move: tabMsg,
        integrity_forecast: tabMsg,
        executive_synthesis: tabMsg,
      },
      personal_insight: fallbackInsight,
      fallback: true,
      generated_at: new Date().toISOString(),
      tokens_in: 0,
      tokens_out: 0,
      latency_ms: Date.now(),
    });
  }
  clearTimeout(t);

  const sections = parseActivationResponse(fullText);
  const personalRaw =
    sections["Personal Insight"] ||
    `Conexa has read your baseline, ${fullName}. Your execution window opens at midnight.`;
  const personal_insight = clampConexaPersonalInsight(
    personalRaw
      .replace(/your first directive generates at midnight/gi, "your execution window opens at midnight")
      .trim(),
  );

  const tab = (key: string) => clampConexaTabBody(sections[key] ?? "");

  const report = {
    version: "v1.0",
    tabs: {
      reality_check: tab("Tab 1 - The Reality Check"),
      blindspot: tab("Tab 2 - The Blindspot"),
      shipping_vs_noise: tab("Tab 3 - Shipping vs. Noise"),
      next_move: tab("Tab 4 - The Next Move"),
      integrity_forecast: tab("Tab 5 - The Integrity Forecast"),
      executive_synthesis: tab("Tab 6 - Executive Synthesis"),
    },
    personal_insight,
    generated_at: new Date().toISOString(),
    tokens_in,
    tokens_out,
    latency_ms,
  };

  return NextResponse.json(report);
}
