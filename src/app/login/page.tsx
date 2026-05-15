"use client";

import { AuthMobileHelp } from "@/components/auth-mobile-help";
import { userFacingAuthError } from "@/lib/auth/auth-error-message";
import { createClient } from "@/lib/supabase/client";
import { oauthRedirectUrl } from "@/lib/auth/oauth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ae = p.get("auth_error");
    if (!ae) return;
    setError(decodeURIComponent(ae.replace(/\+/g, " ")));
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    await supabase.auth.getUser();
    const me = await fetch("/api/me", { credentials: "same-origin" });
    setLoading(false);
    if (!me.ok) {
      router.push("/start");
      router.refresh();
      return;
    }
    const { user: row } = await me.json();
    const execCount = Number(row.execution_count ?? 0);
    if (execCount >= 1) {
      router.push("/dashboard");
    } else {
      router.push("/start");
    }
    router.refresh();
  }

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    const redirectTo = oauthRedirectUrl("/dashboard");
    if (!redirectTo) {
      setLoading(false);
      setError("Could not build redirect URL.");
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    setLoading(false);
    if (err) setError(err.message);
  }

  return (
    <main className="min-h-screen bg-[var(--mi)] text-[var(--fw)] flex items-center justify-center p-6">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 space-y-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <form onSubmit={signIn} className="space-y-4">
          <input
            type="email"
            required
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="text-sm text-[var(--red)] whitespace-pre-line">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--ac)] text-[var(--mi)] font-semibold py-2"
          >
            {loading ? "…" : "Sign in"}
          </button>
          <p className="text-sm text-center">
            <Link href="/auth/forgot-password" className="text-[var(--ac)] underline">
              Forgot password?
            </Link>
          </p>
        </form>
        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-[var(--t3)]">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void signInWithGoogle()}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-black/20 text-[var(--fw)] font-medium py-2 hover:bg-black/30"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        <p className="text-sm text-[var(--ca)] text-center">
          New?{" "}
          <Link href="/start" className="text-[var(--ac)] underline">
            Start your record
          </Link>
        </p>
        <AuthMobileHelp afterResetPath="/login" />
      </div>
    </main>
  );
}
