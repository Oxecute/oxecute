"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MIN_LEN = 8;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(!!session);
        return;
      }
      if (event === "SIGNED_IN" && session) {
        setHasSession(true);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setSessionChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LEN) {
      setError(`Use at least ${MIN_LEN} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    const me = await fetch("/api/me", { credentials: "same-origin" });
    if (me.ok) {
      const { user: row } = await me.json();
      const execCount = Number(row.execution_count ?? 0);
      router.replace(execCount >= 1 ? "/dashboard" : "/start");
    } else {
      router.replace("/start");
    }
    router.refresh();
  }

  return (
    <main
      data-onboarding-surface="true"
      className="min-h-screen bg-[var(--mi)] text-[var(--fw)] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md glass-card rounded-2xl p-8 space-y-6">
        <h1 className="text-xl font-semibold">Choose a new password</h1>
        {!sessionChecked ? (
          <p className="text-sm text-[var(--ca)]">Checking your link…</p>
        ) : !hasSession ? (
          <>
            <p className="text-sm text-[var(--orange)]">
              This link is invalid or expired. Request a new reset from the sign-in page.
            </p>
            <p className="text-sm text-center text-[var(--ca)]">
              <Link href="/auth/forgot-password" className="text-[var(--ac)] underline">
                Request a new link
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <p className="text-sm text-[var(--ca)]">
              Signed in from your reset email. Set a new password below.
            </p>
            <input
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[var(--fw)] placeholder:text-[var(--ox-placeholder)]"
              placeholder={`New password (min ${MIN_LEN} characters)`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[var(--fw)] placeholder:text-[var(--ox-placeholder)]"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[var(--ac)] text-[var(--mi)] font-semibold py-2 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
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
