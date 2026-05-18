"use client";

import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";
import Link from "next/link";

export default function ConexaPage() {
  return (
    <AuthenticatedShell>
      <section className="max-w-xl space-y-4 text-[var(--t1)]">
        <p className="text-[12px] sm:text-[13px] text-ox-t2 leading-relaxed">
          Your Day 0 read, calibration synthesis, and Ask Conexa live on your Operating Record. Use the floating{" "}
          <span className="text-[#7C64DC] font-medium">CONEXA · Ask</span> button there for chat.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-full bg-[var(--p)] text-[var(--fw)] px-5 py-2.5 text-sm font-semibold hover:opacity-95"
        >
          Open Operating Record
        </Link>
      </section>
    </AuthenticatedShell>
  );
}
