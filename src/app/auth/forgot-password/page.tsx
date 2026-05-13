"use client";

import { createClient } from "@/lib/supabase/client";
import { passwordRecoveryCallbackUrl } from "@/lib/auth/recovery-redirect";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const redirectTo = passwordRecoveryCallbackUrl();
    if (!redirectTo) {
      setBusy(false);
      setError("Could not build redirect URL.");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie = `oxecute_pw_reset_intent=1; Path=/; Max-Age=900; SameSite=Lax${secure}`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo },
    );
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
  }

  return (
    <main
      data-onboarding-surface="true"
      className="min-h-screen bg-[var(--mi)] text-[var(--fw)] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md glass-card rounded-2xl p-8 space-y-6">
        <h1 className="text-xl font-semibold">Reset password</h1>
        {done ? (
          <p className="text-sm text-[var(--ca)]">
            If an account exists for that email, we sent a link. Open it to choose a new
            password. You can close this tab.
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--ca)]">
              Enter the email you used to sign up. We&apos;ll send a secure link (valid for a
              limited time).
            </p>
            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[var(--fw)] placeholder:text-[var(--ca)]/80"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-[var(--ac)] text-[var(--mi)] font-semibold py-2 disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
        <p className="text-sm text-center text-[var(--ca)]">
          <Link href="/login" className="text-[var(--ac)] underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
