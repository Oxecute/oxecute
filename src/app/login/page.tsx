"use client";

import { AmbientParticles } from "@/components/marketing/AmbientParticles";
import { MarketingSiteNav } from "@/components/marketing/MarketingSiteNav";
import { AuthMobileHelp } from "@/components/auth-mobile-help";
import "@/app/execution-intelligence.css";
import { oauthRedirectUrl } from "@/lib/auth/oauth";
import { createClient } from "@/lib/supabase/client";
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
    "w-full rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[10px] text-sm text-[#EEEEF2] outline-none transition focus:border-[rgba(99,102,241,0.5)] focus:bg-[rgba(99,102,241,0.04)] focus:ring-[3px] focus:ring-[rgba(99,102,241,0.09)]";

  return (
    <main
      data-onboarding-surface="true"
      className="ei-root relative flex min-h-dvh flex-col bg-[#080910] text-[#EEEEF2]"
    >
      <AmbientParticles />
      <MarketingSiteNav page="login" />

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center gap-4 md:gap-5">
          <div className="w-full overflow-hidden rounded-2xl border border-white/[0.11] bg-[#0d0f1a] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="px-6 pt-5 pb-1 md:px-8 md:pt-6">
              <h1
                className="text-[24px] font-extrabold tracking-[-0.02em] text-[#EEEEF2] md:text-[26px]"
                style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
              >
                Sign in
              </h1>
            </div>
            <form onSubmit={(e) => void signIn(e)} className="space-y-3 px-6 py-5 md:px-8 md:py-6 md:pt-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#9194AB]">Email</label>
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
                <label className="mb-1 block text-[11px] font-medium text-[#9194AB]">
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
              {error ? <p className="whitespace-pre-line text-sm text-orange-300">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="min-h-[46px] w-full rounded-[11px] bg-gradient-to-br from-[#6366F1] to-[#7C3AED] text-[14px] font-semibold text-white shadow-[0_4px_24px_rgba(99,102,241,0.35)] transition-all hover:shadow-[0_8px_32px_rgba(99,102,241,0.45)] disabled:opacity-50"
              >
                {loading ? "Signing in" : "Sign in"}
              </button>
              <p className="text-center text-[13px] text-[#9194AB]">
                <Link href="/auth/forgot-password" className="text-[#818CF8] underline">
                  Forgot password
                </Link>
              </p>
              <div className="flex items-center gap-3 py-0.5">
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
                <img
                  src="/brand/google-g.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="g-icon-img"
                  decoding="async"
                />
                Continue with Google
              </button>
            </form>
          </div>

          <div className="w-full space-y-3 pb-2">
            <AuthMobileHelp afterResetPath="/login" />
            <p className="text-center text-[13px] text-[#9194AB]">
              New here?{" "}
              <Link href="/start" className="text-[#818CF8] underline">
                Create your account
              </Link>
            </p>
            <div className="flex justify-center">
              <Link
                href="/"
                className="rounded-[9px] border border-white/[0.11] px-4 py-2 text-[13px] text-[#9194AB] hover:bg-white/[0.04]"
              >
                Back to site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
