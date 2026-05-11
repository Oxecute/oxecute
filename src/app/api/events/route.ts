import { logEvent } from "@/lib/analytics";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  event_type: z.string(),
  properties: z.record(z.string(), z.unknown()).optional(),
  session_id: z.string().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await logEvent(
    parsed.data.event_type,
    parsed.data.properties ?? {},
    user?.id ?? null,
    parsed.data.session_id ?? "web",
  );
  return NextResponse.json({ ok: true });
}
