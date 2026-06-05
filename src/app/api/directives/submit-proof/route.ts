import { getAcknowledgment } from "@/lib/conexa/acknowledgments";
import { sha256Hex } from "@/lib/crypto";
import { executionDayNumber, utcTodayISO } from "@/lib/dates";
import { logEvent } from "@/lib/analytics";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { validateProofUrl } from "@/lib/url-validation";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const submitProofSchema = z.object({
  directive_id: z.string().uuid(),
  proof_url: z.string().url(),
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
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { directive_id, proof_url } = parsed.data;
    const admin = createServiceRoleClient();

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

    // Validate the proof URL
    const check = await validateProofUrl(proof_url);
    if (!check.ok) {
      return NextResponse.json({ error: check.failureReason ?? "URL verification failed" }, { status: 400 });
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
        proof_url,
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
      url: proof_url,
      validation_hash: hash,
      url_resolved_status: check.httpStatus,
      url_content_type: check.contentType ?? null,
      execution_day: true,
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

    const ack = getAcknowledgment("verified_proof", directive.behavioral_tag || "product");

    return NextResponse.json({ ok: true, acknowledgment: ack });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
