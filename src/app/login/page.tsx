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
    "w-full rounded-[10px] bg-[#1C1F2A] border border-[rgba(255,255,255,0.055)] px-[14px] py-[10px] text-sm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:ring-0 placeholder:text-[var(--ox-placeholder)]";

  return (
    <main
      data-onboarding-surface="true"
      className="ei-root relative flex min-h-dvh flex-col bg-[#111318] text-[#EAEFF8]"
    >
      <AmbientParticles />
      <MarketingSiteNav page="login" />

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center gap-4 md:gap-5">
          <div className="w-full overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.055)] bg-[#13151C] shadow-[0_32px_80px_rgba(0,0,0,0.55)]">
            <div className="px-6 pt-5 pb-1 md:px-8 md:pt-6">
              <h1
                className="text-[24px] font-extrabold tracking-[-0.02em] text-[#EAEFF8] md:text-[26px]"
                style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
              >
                Sign in
              </h1>
            </div>
            <form onSubmit={(e) => void signIn(e)} className="space-y-3 px-6 py-5 md:px-8 md:py-6 md:pt-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ox-t3">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className={inputCls}
                  placeholder="you@startup.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ox-t3">
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
                className="min-h-[46px] w-full rounded-[10px] bg-[#0EA472] text-[14px] font-semibold text-white shadow-[0_4px_16px_rgba(14,164,114,0.25)] transition-all hover:shadow-[0_4px_20px_rgba(14,164,114,0.35)] disabled:opacity-50"
              >
                {loading ? "Signing in" : "Sign in"}
              </button>
              <p className="text-center text-[13px] text-ox-t2">
                <Link href="/auth/forgot-password" className="text-[#4F46E5] underline">
                  Forgot password
                </Link>
              </p>
              <div className="flex items-center gap-3 py-0.5">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-[11px] text-ox-t3">or</span>
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
            <p className="text-center text-[13px] text-ox-t2">
              New here?{" "}
              <Link href="/start" className="text-[#4F46E5] underline">
                Create your account
              </Link>
            </p>
            <div className="flex justify-center">
              <Link
                href="/"
                className="rounded-[9px] border border-white/[0.11] px-4 py-2 text-[13px] text-ox-t2 hover:bg-white/[0.04]"
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
