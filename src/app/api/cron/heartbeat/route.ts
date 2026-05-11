import { runCronHeartbeat } from "@/lib/cron/heartbeat";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    await runCronHeartbeat();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "cron failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
