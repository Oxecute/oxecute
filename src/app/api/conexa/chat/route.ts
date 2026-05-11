import { conexaChat } from "@/lib/conexa/anthropic";
import {
  getSpeculationRedirect,
  isSpeculationMessage,
  responseHasForbiddenIdentity,
} from "@/lib/speculation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { executionRate } from "@/lib/dates";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
  session_id: z.string().optional(),
});

function buildContext(u: Record<string, unknown>, entries: { day_number: number; category: string; tier: string; url?: string | null; declaration_text?: string | null }[]) {
  const pPct = 33,
    dPct = 33,
    oPct = 34;
  const lines = entries
    .map(
      (e) =>
        `${e.day_number} · ${e.category} · ${e.tier} · ${(e.url || e.declaration_text || "").slice(0, 80)}`,
    )
    .join("\n");
  return `=== FOUNDER OPERATING RECORD ===
Name: ${u.full_name}
Startup: ${u.startup_name}
Stage: ${u.stage} | MRR: ${u.mrr}
Days on record: (computed server-side)
Execution count: ${u.execution_count} | Breaks: ${u.break_count}
Execution rate: ${executionRate(Number(u.execution_count ?? 0), String(u.created_at))}%
Category mix: Product ${pPct}% / Distribution ${dPct}% / Ops ${oPct}%
=== PERMANENT BASELINE ===
Description: ${u.startup_description}
Q1 Shipped: ${u.cal_q1_shipped}
Q2 Customers: ${u.cal_q2_customers}
Q3 Didn't work: ${u.cal_q3_didnt_work}
Q4 Traction: ${u.cal_q4_traction}
Q5 30-day unknown: ${u.cal_q5_unknown}
Biggest blocker: ${u.blocker_text}
Avoidance pattern: ${((u.avoidance_tags as string[]) || []).join(", ")}
=== RECENT SUBMISSIONS (last 10) ===
${lines}
=== END CONTEXT ===`;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: u } = await admin.from("users").select("*").eq("id", user.id).single();
  if (!u) return NextResponse.json({ error: "No user" }, { status: 404 });

  const msg = parsed.data.message;
  if (isSpeculationMessage(msg)) {
    const redirect = getSpeculationRedirect(u.execution_count ?? 0);
    await admin.from("conexa_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: redirect,
      flagged_speculation: true,
      prompt_version: "CHAT_PROMPT_V1",
    });
    await admin.from("conexa_messages").insert({
      user_id: user.id,
      role: "user",
      content: msg,
      flagged_speculation: true,
    });
    return NextResponse.json({ text: redirect, speculation: true });
  }

  const { data: recent } = await admin
    .from("entries")
    .select("day_number, category, tier, url, declaration_text")
    .eq("user_id", user.id)
    .order("day_number", { ascending: false })
    .limit(10);

  const context = buildContext(u as Record<string, unknown>, recent ?? []);
  const { data: hist } = await admin
    .from("conexa_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(20);

  const messages = (hist ?? []).map((h) => ({
    role: h.role as "user" | "assistant",
    content: h.content,
  }));
  messages.push({ role: "user", content: `${context}\n\nUser question: ${msg}` });

  let text: string;
  let tokens_in = 0;
  let tokens_out = 0;
  let latency_ms = 0;
  try {
    const r = await conexaChat(messages);
    text = r.text;
    tokens_in = r.tokens_in;
    tokens_out = r.tokens_out;
    latency_ms = r.latency_ms;
    if (responseHasForbiddenIdentity(text)) {
      const r2 = await conexaChat([
        ...messages,
        {
          role: "assistant",
          content: text,
        },
        {
          role: "user",
          content:
            "Do not mention Claude, Anthropic, or that you are an AI. Answer the founder directly.",
        },
      ]);
      text = r2.text;
      if (responseHasForbiddenIdentity(text)) {
        text = "Conexa is processing your record. Send your question again.";
      }
    }
  } catch {
    text = "Conexa is processing your record. Send your question again.";
  }

  await admin.from("conexa_messages").insert({ user_id: user.id, role: "user", content: msg });
  await admin.from("conexa_messages").insert({
    user_id: user.id,
    role: "assistant",
    content: text,
    tokens_in,
    tokens_out,
    latency_ms,
    prompt_version: "CHAT_PROMPT_V1",
  });

  return NextResponse.json({ text, tokens_in, tokens_out, latency_ms });
}
