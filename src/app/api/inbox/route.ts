import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { z } from "zod";

/** Inbox display order per product spec (tier 1 = top). */
function inboxSortMeta(n: { title: string; type: string }): { tier: number; milestoneDay: number } {
  const t = n.title.toLowerCase();
  if (t.includes("conexa has read your baseline")) return { tier: 1, milestoneDay: 0 };
  if (t.includes("welcome to oxecute")) return { tier: 2, milestoneDay: 0 };
  if (t.includes("reminder") || (t.includes("directive") && t.includes("midnight"))) return { tier: 3, milestoneDay: 0 };
  if (t.includes("break mark")) return { tier: 4, milestoneDay: 0 };
  if (/\b7 days executed\b/.test(t)) return { tier: 5, milestoneDay: 7 };
  if (/\b14 days executed\b/.test(t)) return { tier: 5, milestoneDay: 14 };
  if (/\b21 days executed\b/.test(t)) return { tier: 5, milestoneDay: 21 };
  if (/\b45 days executed\b/.test(t)) return { tier: 5, milestoneDay: 45 };
  return { tier: 99, milestoneDay: 0 };
}

const patchSchema = z
  .object({
    mark_all_read: z.boolean().optional(),
    ids: z.array(z.string().uuid()).optional(),
  })
  .strict();

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("notifications")
    .select("id, type, title, body, action_url, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const raw = data ?? [];
  const seen = new Set<string>();
  const notifications = raw.filter((n) => {
    const k = `${n.title}\0${n.body ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  notifications.sort((a, b) => {
    if (a.read !== b.read) {
      return a.read ? 1 : -1;
    }
    const ma = inboxSortMeta(a);
    const mb = inboxSortMeta(b);
    if (ma.tier !== mb.tier) return ma.tier - mb.tier;
    if (ma.tier === 5 && mb.tier === 5 && ma.milestoneDay !== mb.milestoneDay) {
      return ma.milestoneDay - mb.milestoneDay;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return NextResponse.json({ notifications });
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
  const p = parsed.data;

  if (p.mark_all_read) {
    const { error } = await admin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (p.ids?.length) {
    const { error } = await admin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .in("id", p.ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
