"use client";

import { AuthMobileHelp } from "@/components/auth-mobile-help";
import { OnboardingTopNav } from "@/components/onboarding/OnboardingTopNav";
import { createClient } from "@/lib/supabase/client";
import { oauthRedirectUrl } from "@/lib/auth/oauth";
import "@/app/execution-intelligence.css";
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

  const inputCls =
    "w-full rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm text-[#EEEEF2] outline-none transition focus:border-[rgba(99,102,241,0.5)] focus:bg-[rgba(99,102,241,0.04)] focus:ring-[3px] focus:ring-[rgba(99,102,241,0.09)]";

  return (
    <main
      data-onboarding-surface="true"
      className="ei-root min-h-screen bg-[#080910] text-[#EEEEF2] flex flex-col"
    >
      <OnboardingTopNav />

      <div className="flex flex-1 min-h-0 w-full pt-[58px] flex-col">
        <div className="flex flex-1 min-h-0 overflow-y-auto w-full">
          <div className="flex min-h-full w-full flex-col md:items-center md:justify-center py-8 px-4 md:px-6 pb-12">
            <div className="w-full max-w-[560px] rounded-2xl border border-white/[0.11] bg-[#0d0f1a] shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="px-6 md:px-8 pt-7 pb-5 border-b border-white/[0.06]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#818CF8] mb-2">
                  Session
                </p>
                <h1
                  className="text-[26px] font-extrabold text-[#EEEEF2] tracking-[-0.02em] mb-2"
                  style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
                >
                  Sign in
                </h1>
                <p className="text-[13px] font-light text-[#9194AB] leading-relaxed">
                  Same account as sign-up — continue your startup and Conexa flow.
                </p>
              </div>
              <form onSubmit={(e) => void signIn(e)} className="px-6 md:px-8 py-7 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#9194AB] mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className={inputCls}
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#9194AB] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    className={inputCls}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error ? <p className="text-sm text-orange-300 whitespace-pre-line">{error}</p> : null}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] rounded-[11px] text-[14px] font-semibold text-white bg-gradient-to-br from-[#6366F1] to-[#7C3AED] shadow-[0_4px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.45)] disabled:opacity-50 transition-all"
                >
                  {loading ? "…" : "Sign in"}
                </button>
                <p className="text-[13px] text-center text-[#9194AB]">
                  <Link href="/auth/forgot-password" className="text-[#818CF8] underline">
                    Forgot password
                  </Link>
                </p>
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-[11px] text-[#52556A]">or</span>
                  <div className="h-px flex-1 bg-white/[0.08]" />
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void signInWithGoogle()}
                  className="btn-google w-full"
                >
                  <span className="g-icon" aria-hidden />
                  Continue with Google
                </button>
              </form>
            </div>
            <div className="w-full max-w-[560px] mt-6 space-y-4">
              <AuthMobileHelp afterResetPath="/login" />
              <p className="text-[13px] text-center text-[#9194AB]">
                New here?{" "}
                <Link href="/start" className="text-[#818CF8] underline">
                  Create your account
                </Link>
              </p>
              <div className="flex justify-center">
                <Link
                  href="/"
                  className="text-[13px] text-[#9194AB] border border-white/[0.11] rounded-[9px] px-4 py-2 hover:bg-white/[0.04]"
                >
                  ← Back to site
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
