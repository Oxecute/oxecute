import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

function verifyStripeSignature(rawBody: string, header: string, secret: string): boolean {
  try {
    const parts = header.split(",");
    const timestamp = parts.find((p) => p.startsWith("t="))?.substring(2);
    const signature = parts.find((p) => p.startsWith("v1="))?.substring(3);
    if (!timestamp || !signature) return false;

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const event = JSON.parse(rawBody);

    const signature = request.headers.get("stripe-signature") || "";
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (secret && signature) {
      if (!verifyStripeSignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 401 });
      }
    }

    // Resolve event details
    const eventType = event.type || "";
    const dataObj = event.data?.object || {};

    // Retrieve email from various possible Stripe fields
    const customerEmail = dataObj.customer_email || dataObj.billing_details?.email || dataObj.receipt_email || dataObj.email || "";
    const email = String(customerEmail).trim().toLowerCase();

    if (!email) {
      console.warn("[Stripe Webhook] No customer email found in webhook payload");
      return NextResponse.json({ ok: true, message: "No email resolved to map user" });
    }

    const admin = createServiceRoleClient();
    const { data: user, error: userErr } = await admin
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (userErr || !user) {
      console.warn(`[Stripe Webhook] No matching user found for email: ${email}`);
      return NextResponse.json({ ok: true, message: "Email does not match any registered user" });
    }

    // Determine weight and eligibility
    const isPaymentSuccess = eventType === "invoice.payment_succeeded" || eventType === "charge.succeeded" || eventType === "payment_intent.succeeded";
    const weight = isPaymentSuccess ? 1.0 : 0.0;
    const isEligible = isPaymentSuccess;
    const externalId = event.id || `stripe-${Date.now()}`;

    // Log the event in integration_events
    const { error: insertErr } = await admin.from("integration_events").insert({
      user_id: user.id,
      source: "stripe",
      event_type: eventType,
      external_id: externalId,
      payload: event,
      weight,
      is_eligible: isEligible,
    });

    if (insertErr) {
      console.error("[Stripe Webhook] Failed to log integration event:", insertErr);
      return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
    }

    // Handle auto-milestones on payment success
    if (isPaymentSuccess) {
      // 1. Check if First Revenue milestone has been recorded
      const { data: existingMilestone } = await admin
        .from("milestone_events")
        .select("id")
        .eq("user_id", user.id)
        .eq("milestone", "First Revenue")
        .maybeSingle();

      if (!existingMilestone) {
        await admin.from("milestone_events").insert({
          user_id: user.id,
          milestone: "First Revenue",
          execution_count_at: user.execution_count ?? 0,
        });

        // Add a notification for the milestone
        await admin.from("notifications").insert({
          user_id: user.id,
          type: "system",
          title: "Revenue Milestone Unlocked: First Revenue",
          body: "Conexa verified your first payment success via Stripe. Milestone recorded on your ledger.",
          action_url: "/dashboard",
          read: false,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      mapped_user: user.email,
      event_logged: true,
      weight,
    });
  } catch (err) {
    const error = err as Error;
    console.error("[Stripe Webhook] Error processing event:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
