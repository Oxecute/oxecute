"use client";

import { useState } from "react";

export function WaitlistBlock({ featureSlug, title }: { featureSlug: string; title: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  return (
    <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4 mt-6">
      <p className="text-sm font-semibold text-[var(--t1)] mb-2">{title}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          className="flex-1 border border-[var(--bdr)] rounded-lg px-3 py-2 text-sm bg-[var(--bg)]"
          placeholder="you@founder.email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="button"
          className="rounded-full bg-[var(--p)] text-[var(--fw)] text-sm font-semibold px-5 py-2 shrink-0"
          onClick={async () => {
            setStatus("idle");
            const res = await fetch("/api/waitlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, feature_slug: featureSlug }),
            });
            setStatus(res.ok ? "ok" : "err");
          }}
        >
          Join waitlist
        </button>
      </div>
      {status === "ok" ? (
        <p className="text-xs text-green-600 mt-2">You&apos;re on the list.</p>
      ) : null}
      {status === "err" ? (
        <p className="text-xs text-[var(--red)] mt-2">Could not save - check email.</p>
      ) : null}
    </div>
  );
}
