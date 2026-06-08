import { sha256Hex } from "@/lib/crypto";
import { executionDayNumber, utcTodayISO } from "@/lib/dates";
import { logEvent } from "@/lib/analytics";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { validateProofUrl } from "@/lib/url-validation";
import { assertValidUploadPathsForUser } from "@/lib/entry-uploads";
import { callAnthropic } from "@/lib/conexa/anthropic";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const submitProofSchema = z.object({
  directive_id: z.string().uuid(),
  proof_url: z.string().min(1),
  upload_paths: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const json = await request.json().catch(() => null);
    const parsed = submitProofSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload. Submission cannot be empty." }, { status: 400 });
    }

    const { directive_id, proof_url, upload_paths } = parsed.data;
    const admin = createServiceRoleClient();

    // Validate upload paths if present
    let checkedUploadPaths: string[] | null = null;
    if (upload_paths && upload_paths.length > 0) {
      try {
        checkedUploadPaths = assertValidUploadPathsForUser(upload_paths, user.id);
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message || "Invalid upload paths" }, { status: 400 });
      }
    }

    // Fetch the active directive
    const { data: directive, error: fetchErr } = await admin
      .from("directives")
      .select("*")
      .eq("id", directive_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !directive) {
      return NextResponse.json({ error: "Directive not found." }, { status: 404 });
    }

    if (directive.status !== "open") {
      return NextResponse.json({ error: "Directive is already closed." }, { status: 400 });
    }

    // Call Conexa (Claude) to evaluate the submission
    const systemPrompt = `You are Conexa, the AI execution evaluator for Oxecute.
Your job is to read an execution directive issued to a founder and evaluate if their submitted proof (which can be a URL, a text explanation, or a combination of both, including any attached files/screenshots) satisfies the requirements of the directive.

Evaluation Rules:
1. Be direct, objective, and operational.
2. If the user provides a relevant link (e.g. Loom, GitHub commit/PR, Google Doc, Tweet/LinkedIn post), a clear text description of the actions they took that demonstrates completion, or has uploaded/attached files/screenshots (listed as ATTACHED FILES) that match the directive requirements, approve it.
3. Reject empty, gibberish, lazy, or obviously evasive submissions (e.g. typing "done", "test", "ok", "completed", "none", or pasting "https://google.com" for a Loom recording requirement).
4. If the directive specifies a specific tool (e.g. "submit a Loom recording"), and they provide a clear description of the call instead of a Loom link, you may accept it if they detail what they did, but encourage them to provide links in the future.
5. You MUST return ONLY a valid JSON object with exactly two keys:
   - "ok": boolean (true if the submission is accepted as valid proof of execution, false otherwise)
   - "reason": string (a short, direct, 1-2 sentence explanation of your decision, directly addressing the founder)
Do not write any other text, headers, or markdown formatting. Output raw JSON only.`;

    let userPrompt = `DAILY DIRECTIVE:
"${directive.directive_text}"
Behavioral Tag: ${directive.behavioral_tag}

FOUNDER SUBMISSION:
"${proof_url}"`;

    if (checkedUploadPaths && checkedUploadPaths.length > 0) {
      const filenames = checkedUploadPaths.map(path => {
        const parts = path.split("/");
        return parts[parts.length - 1] || path;
      });
      userPrompt += `\n\nATTACHED FILES:\n${filenames.map(f => `- ${f}`).join("\n")}`;
    }

    let evaluation = { ok: true, reason: "Proof accepted." };
    try {
      const response = await callAnthropic({
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: 300,
      });

      const cleanJsonStr = response.text
        .replace(/```json/i, "")
        .replace(/```/g, "")
        .trim();

      const parsedEval = JSON.parse(cleanJsonStr);
      if (typeof parsedEval.ok === "boolean") {
        evaluation = {
          ok: parsedEval.ok,
          reason: parsedEval.reason || (parsedEval.ok ? "Proof accepted." : "Proof is insufficient."),
        };
      }
    } catch (err) {
      console.error("[Submit Proof] AI evaluation failed, falling back to auto-approval:", err);
    }

    if (!evaluation.ok) {
      return NextResponse.json({ error: evaluation.reason }, { status: 400 });
    }

    // Validate if it looks like a URL for the ledger metadata
    const check = { ok: true, httpStatus: 200, contentType: null as string | null };

    const isUrl = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(proof_url.trim());
    if (isUrl) {
      try {
        const urlCheck = await validateProofUrl(proof_url.trim());
        if (urlCheck.ok) {
          check.httpStatus = urlCheck.httpStatus ?? 200;
          check.contentType = urlCheck.contentType ?? null;
        }
      } catch {
        // Suppress validation errors for urls to avoid blocking
      }
    }

    const { data: profile } = await admin.from("users").select("*").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ error: "No profile found." }, { status: 404 });

    const today = utcTodayISO();
    const dayNum = executionDayNumber(profile.created_at as string, new Date());

    // Check if the user already has a submission for the current UTC day
    const { data: daySlot } = await admin
      .from("entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("day_number", dayNum)
      .maybeSingle();

    if (daySlot) {
      return NextResponse.json(
        { error: "You already have an entry for this execution day. One submission per UTC day." },
        { status: 409 }
      );
    }

    // Update the directive status
    const { error: dirErr } = await admin
      .from("directives")
      .update({
        status: "completed",
        proof_url: proof_url.trim(),
        closed_at: new Date().toISOString(),
      })
      .eq("id", directive_id);

    if (dirErr) {
      return NextResponse.json({ error: "Failed to update directive." }, { status: 500 });
    }

    // Insert to the entries (ledger) table as Verified Proof
    const { data: last } = await admin
      .from("entries")
      .select("entry_number")
      .eq("user_id", user.id)
      .order("entry_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextEntry = (last?.entry_number ?? 0) + 1;
    const hash = await sha256Hex(proof_url + new Date().toISOString());

    const { error: insertErr } = await admin.from("entries").insert({
      user_id: user.id,
      entry_number: nextEntry,
      day_number: dayNum,
      category: directive.behavioral_tag || "product",
      source_type: "manual_url",
      tier: "verified_proof",
      url: isUrl ? proof_url.trim() : null,
      declaration_text: isUrl ? null : proof_url.trim(),
      validation_hash: hash,
      url_resolved_status: isUrl ? check.httpStatus : 200,
      url_content_type: isUrl ? (check.contentType ?? null) : null,
      execution_day: true,
      upload_paths: checkedUploadPaths,
    });

    if (insertErr) {
      // Rollback directive update in case of ledger insert failure
      await admin.from("directives").update({ status: "open", proof_url: null, closed_at: null }).eq("id", directive_id);
      return NextResponse.json({ error: "Failed to create ledger entry." }, { status: 500 });
    }

    // Update user stats
    await admin
      .from("users")
      .update({
        execution_count: (profile.execution_count ?? 0) + 1,
        last_submission_date: today,
      })
      .eq("id", user.id);

    await logEvent("directive_completed", { directive_id, day_number: dayNum }, user.id, "web");

    return NextResponse.json({ ok: true, acknowledgment: evaluation.reason });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
