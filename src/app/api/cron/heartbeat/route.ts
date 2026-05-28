import { runCronHeartbeat } from "@/lib/cron/heartbeat";
import { NextResponse } from "next/server";

/** Vercel Cron invokes GET with `Authorization: Bearer CRON_SECRET` when configured. */
async function handleCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    let overrideNow: Date | undefined = undefined;
    try {
      const url = new URL(request.url);
      const sim = url.searchParams.get("simulated_time");
      if (sim) {
        overrideNow = new Date(sim);
      }
    } catch {}

    await runCronHeartbeat(overrideNow);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "cron failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
