import { createServiceRoleClient } from "@/lib/supabase/service";

export async function logEvent(
  eventType: string,
  properties: Record<string, unknown> = {},
  userId?: string | null,
  sessionId: string = "server",
) {
  try {
    const supabase = createServiceRoleClient();
    await supabase.from("events").insert({
      user_id: userId ?? null,
      event_type: eventType,
      properties,
      session_id: sessionId,
    });
  } catch {
    /* never break UX on analytics */
  }
}
