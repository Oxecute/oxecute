"use client";

import { AmbientParticles } from "@/components/marketing/AmbientParticles";
import { MarketingSiteNav } from "@/components/marketing/MarketingSiteNav";
import { createClient } from "@/lib/supabase/client";
import { oauthRedirectUrl } from "@/lib/auth/oauth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import "@/app/execution-intelligence.css";

const LANDING_PREFILL = "oxecute_landing_prefill";

const IRC_GRID_TYPES = [
  "build",
  "build",
  "strategy",
  "build",
  "external",
  "build",
  "spec",
  "break",
  "build",
  "build",
  "build",
  "spec",
  "build",
  "audit",
  "build",
  "build",
  "strategy",
  "build",
  "external",
  "spec",
  "build",
  "build",
  "break",
  "build",
  "build",
  "build",
  "build",
  "build",
  "launch",
] as const;

const IRC_COLORS: Record<string, string> = {
  build: "rgba(79,70,229,0.7)",
  strategy: "rgba(124,100,220,0.65)",
  external: "rgba(14,164,114,0.7)",
  audit: "rgba(194,164,120,0.7)",
  spec: "rgba(79,70,229,0.35)",
  break: "rgba(255,255,255,0.04)",
  launch: "linear-gradient(135deg,#0EA472,#4F46E5)",
};

/** FAQ copy matches v2 HTML reference (Onboarding & Landing brief). */
const FAQ_ITEMS: {
  q: string;
  a: React.ReactNode;
}[] = [
  {
    q: "1. What does Conexa tell me?",
    a: (
      <p>
        Conexa is your execution intelligence layer. Six tabs of signal:{" "}
        <strong>Reality Check</strong>, <strong>The Blindspot</strong>,{" "}
        <strong>Shipping vs Noise</strong>, <strong>The Next Move</strong>,{" "}
        <strong>Integrity Forecast</strong>, and <strong>Executive Synthesis</strong>. It
        doesn&apos;t tell you what to build. It tells you what the data says about how you&apos;re
        building.
      </p>
    ),
  },
  {
    q: "2. How is this different from a Notion log?",
    a: (
      <p>
        A Notion doc is what you say you did. Oxecute is what your tools confirm.{" "}
        <strong>No manual entry required.</strong> GitHub, Stripe, Calendar, and Notion auto-push
        into a tamper-proof ledger. You can&apos;t fake a Stripe revenue event.
      </p>
    ),
  },
  {
    q: "3. What happens at Day 21?",
    a: (
      <p>
        <strong>21 days doesn&apos;t mean 21 consecutive days.</strong> Life happens. It means 21
        days executed on record. Conexa&apos;s full intelligence suite activates. You&apos;ve
        earned it — the record proves it.
      </p>
    ),
  },
  {
    q: "4. What happens at Day 60?",
    a: (
      <p>
        The Signal tier unlocks. You can browse investor profiles, your founder profile can go
        public on your terms, and you receive the <strong>VERIFIED SIGNAL badge</strong>. This is
        when the record starts working for you.
      </p>
    ),
  },
  {
    q: "5. Can investors see my data without my permission?",
    a: (
      <p>
        <strong>No.</strong> Private by default, always. Investor visibility is opt-in. Nothing is
        visible to anyone until you explicitly choose to share.
      </p>
    ),
  },
];

/** Hero ticker + CTA figures (brief): founders, countries, spots remaining. */
const MARKETING_HERO_STATS = {
  founders: 128,
  countries: 12,
  spotsRemaining: 72,
} as const;

export function ExecutionIntelligenceLanding() {
  const router = useRouter();
  const [heroReveal, setHeroReveal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [carouselIdx, setCarouselIdx] = useState(0);
  /** Index of slide playing exit animation */
  const [leavingIdx, setLeavingIdx] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [faqOpen, setFaqOpen] = useState(0);

  const labels = ["Capture", "Compound", "Convert"];

  const goCarousel = useCallback((n: number) => {
    if (n === carouselIdx) return;
    setLeavingIdx(carouselIdx);
    window.setTimeout(() => setCarouselIdx(n), 30);
    window.setTimeout(() => setLeavingIdx(null), 560);
  }, [carouselIdx]);

  const nextSlide = useCallback(() => {
    goCarousel((carouselIdx + 1) % 3);
  }, [carouselIdx, goCarousel]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide]);

  useEffect(() => {
    const t = window.setTimeout(() => setHeroReveal(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("vis");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll(".ei-root .rv").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function storePrefillAndStart() {
    try {
      sessionStorage.setItem(
        LANDING_PREFILL,
        JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        }),
      );
    } catch {
      /* ignore */
    }
    router.push("/start");
  }

  async function googleStart() {
    const redirectTo = oauthRedirectUrl("/start");
    if (!redirectTo) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  return (
    <div className="ei-root">
      <AmbientParticles />
      <MarketingSiteNav page="landing" />

      <section className="hero">
        <div className="hero-glow-l" aria-hidden />
        <div className="hero-glow-r" aria-hidden />

        <div className="hero-l">
          <div className="hero-ticker">
            <div className="ticker-bar">
              <div className="ticker-seg ticker-seg-live">
                <div className="ticker-live">
                  <span className="ticker-live-stack">
                    <span className="ticker-live-line">Beta</span>
                    <span className="ticker-live-line">Live</span>
                  </span>
                </div>
              </div>
              <div className="ticker-seg ticker-seg-stats">
                <div className="ticker-stat">
                  <span className="ticker-stat-value">{MARKETING_HERO_STATS.founders}</span>
                  <span className="ticker-stat-label">Founders</span>
                </div>
                <div className="ticker-stat">
                  <span className="ticker-stat-value">{MARKETING_HERO_STATS.countries}</span>
                  <span className="ticker-stat-label">Countries</span>
                </div>
              </div>
              <div className="ticker-seg ticker-seg-spots">
                <div className="ticker-spots">
                  <span className="ticker-spots-value">{MARKETING_HERO_STATS.spotsRemaining} Spots</span>
                  <span className="ticker-spots-label">Remaining</span>
                </div>
              </div>
            </div>
          </div>

          <h1 className={`hero-h1 ${heroReveal ? "vis" : ""}`}>
            <span className="hero-h1-line">You&apos;re building daily.</span>
            <span className="hero-h1-line">You can&apos;t tell if it&apos;s working.</span>
          </h1>

          <p className={`hero-body ${heroReveal ? "vis" : ""}`}>
            Your execution is real. The problem is it&apos;s invisible to investors, to the market,
            to anyone who didn&apos;t watch you build.
            <br />
            Oxecute turns what you actually do into a verified record.
            <br />
            Conexa reads the pattern and tells you what&apos;s working, what you&apos;re circling,
            and what to move on next. Every day you execute, the record builds.
          </p>

          <div className={`hero-form ${heroReveal ? "vis" : ""}`}>
            <div className="form-row">
              <input
                className="fi"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className="fi"
                placeholder="Second Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <input
              className="fi"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="fi"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="btn-cta" onClick={storePrefillAndStart}>
              Join the founding cohort
            </button>
            <div className="or-row">or</div>
            <button type="button" className="btn-google" onClick={() => void googleStart()}>
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
          </div>

          <div className={`trust-row ${heroReveal ? "vis" : ""}`}>
            <div className="trust-item">Commit when you&apos;re ready. No card to start.</div>
          </div>
        </div>

        <div className="hero-r">
          <div className="carousel-wrap">
            <div className="c-glow" aria-hidden />
            <div className="c-track">
              <div
                className={`c-slide ${carouselIdx === 0 ? "active" : ""} ${leavingIdx === 0 ? "exit" : ""}`}
                >
                  <div className="screen">
                    <div className="screen-bar">
                      <div className="sd" />
                      <div className="sd" />
                      <div className="sd" />
                      <div className="url-bar">oxecute.com/connect</div>
                    </div>
                    <div className="screen-body">
                      <div>
                        <div className="s-label">01 · Capture</div>
                        <div className="s-heading">Log what you shipped today.</div>
                        <div className="s-sub">
                          Every day you execute, the record builds. Append-only. Tamper-proof. Your
                          execution history starts on day one.
                        </div>
                      </div>
                      <div className="ledger-rows">
                        <div className="lr">
                          <div
                            className="int-ico"
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              fontSize: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "rgba(255,255,255,0.07)",
                              color: "var(--t2)",
                              flexShrink: 0,
                            }}
                          >
                            ⌥
                          </div>
                          <div className="li">
                            <div className="ln">Shipped Conexa intake flow</div>
                            <div className="lt">2026-05-14 · 09:17 UTC</div>
                          </div>
                          <div className="lb lb-v">Logged</div>
                        </div>
                        <div className="lr">
                          <div
                            className="int-ico"
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              fontSize: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "rgba(79,70,229,0.14)",
                              color: "#A5B4FC",
                              flexShrink: 0,
                            }}
                          >
                            $
                          </div>
                          <div className="li">
                            <div className="ln">First paying user · Builder</div>
                            <div className="lt">2026-05-13 · 14:42 UTC</div>
                          </div>
                          <div className="lb lb-v">Logged</div>
                        </div>
                        <div className="lr">
                          <div
                            className="int-ico"
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              fontSize: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "rgba(16,185,129,0.12)",
                              color: "#10B981",
                              flexShrink: 0,
                            }}
                          >
                            ◷
                          </div>
                          <div className="li">
                            <div className="ln">Investor call · 48 min</div>
                            <div className="lt">2026-05-13 · 11:08 UTC</div>
                          </div>
                          <div className="lb lb-d">Declared</div>
                        </div>
                      </div>
                      <div className="paste-bar">
                        <div className="paste-ico">✎</div>
                        <div className="paste-text">
                          What did you ship today? Write it. Lock it. It&apos;s yours forever.
                        </div>
                        <button type="button" className="paste-btn">
                          Log it
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={`c-slide ${carouselIdx === 1 ? "active" : ""} ${leavingIdx === 1 ? "exit" : ""}`}
                >
                  <div className="screen">
                    <div className="screen-bar">
                      <div className="sd" />
                      <div className="sd" />
                      <div className="sd" />
                      <div className="url-bar">oxecute.com/ledger</div>
                    </div>
                    <div className="screen-body">
                      <div>
                        <div className="s-label">02 · Compound</div>
                        <div className="s-heading">Every day builds the record.</div>
                        <div className="s-sub">
                          Append-only. Tamper-proof. Your execution compounds in a ledger that speaks
                          for itself.
                        </div>
                      </div>
                      <div className="ledger-rows">
                        {[
                          ["⌥", "4 commits · oxecute-core", "2026-05-14 · 09:17 UTC", "v"],
                          ["$", "Stripe · Builder plan", "2026-05-13 · 14:42 UTC", "v"],
                          ["◷", "Investor call · 48 min", "2026-05-13 · 11:08 UTC", "d"],
                          ["N", "Notion spec · 113 features", "2026-05-12 · 16:33 UTC", "v"],
                        ].map(([ico, title, time, b]) => (
                          <div key={title} className="lr">
                            <div
                              className="int-ico"
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                fontSize: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.07)",
                                flexShrink: 0,
                              }}
                            >
                              {ico}
                            </div>
                            <div className="li">
                              <div className="ln">{title}</div>
                              <div className="lt">{time}</div>
                            </div>
                            <div className={`lb ${b === "v" ? "lb-v" : "lb-d"}`}>
                              {b === "v" ? "Verified" : "Declared"}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="score-strip">
                        <div className="ring-wrap">
                          <svg width="48" height="48" viewBox="0 0 48 48">
                            <circle
                              cx="24"
                              cy="24"
                              r="18"
                              fill="none"
                              stroke="rgba(255,255,255,0.06)"
                              strokeWidth="4"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="18"
                              fill="none"
                              stroke="url(#ei-rg)"
                              strokeWidth="4"
                              strokeDasharray="113.1"
                              strokeDashoffset="30"
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="ei-rg" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#4F46E5" />
                                <stop offset="100%" stopColor="#7C64DC" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="ring-num">74</div>
                        </div>
                        <div className="score-info">
                          <div className="score-name">Signal Score</div>
                          <div className="score-days">21 executed · 2 breaks</div>
                          <div className="bars">
                            <div className="bar-row">
                              <div className="bar-lbl">Streak</div>
                              <div className="bar-track">
                                <div
                                  className="bar-fill"
                                  style={{
                                    width: "78%",
                                    background: "linear-gradient(90deg,#4F46E5,#7C64DC)",
                                  }}
                                />
                              </div>
                            </div>
                            <div className="bar-row">
                              <div className="bar-lbl">Revenue</div>
                              <div className="bar-track">
                                <div
                                  className="bar-fill"
                                  style={{
                                    width: "34%",
                                    background: "linear-gradient(90deg,#10B981,#34D399)",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={`c-slide ${carouselIdx === 2 ? "active" : ""} ${leavingIdx === 2 ? "exit" : ""}`}
                >
                  <div className="screen">
                    <div className="screen-bar">
                      <div className="sd" />
                      <div className="sd" />
                      <div className="sd" />
                      <div className="url-bar">oxecute.com/signal</div>
                    </div>
                    <div className="screen-body">
                      <div>
                        <div className="s-label">03 · Convert</div>
                        <div className="s-heading">Your record speaks for you.</div>
                        <div className="s-sub">
                          Not a pitch deck. A verified track record. Visible on your terms, when you
                          choose.
                        </div>
                      </div>
                        <div className="prof-head">
                        <div className="prof-av">AR</div>
                        <div>
                          <div className="prof-name">Abhi R</div>
                          <div className="prof-role">Founder · India</div>
                        </div>
                        <div className="verified-badge">Verified Signal</div>
                      </div>
                      <div className="metric-grid">
                        <div className="mc">
                          <div className="mv g">74</div>
                          <div className="mk">Signal</div>
                        </div>
                        <div className="mc">
                          <div className="mv tl">91%</div>
                          <div className="mk">Proof wt.</div>
                        </div>
                        <div className="mc">
                          <div className="mv">49</div>
                          <div className="mk">Days exec.</div>
                        </div>
                      </div>
                      <div className="ev-list">
                        <div className="ev">
                          Shipping cadence · 4.2 commits/week
                          <span className="ev-tag">auto-captured</span>
                        </div>
                        <div className="ev">
                          Revenue signal · 3 Stripe events
                          <span className="ev-tag">verified</span>
                        </div>
                        <div className="ev">
                          Investor calls · 6 logged
                          <span className="ev-tag">declared</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
            <div className="c-controls">
              <div className="c-dots">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    className={`cdot ${carouselIdx === i ? "active" : ""}`}
                    onClick={() => goCarousel(i)}
                  />
                ))}
              </div>
              <div className="c-label">{labels[carouselIdx]}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="hiw" id="hiw">
        <div className="section-eye rv">Execution Arc</div>
        <h2 className="section-h rv d1">
          Most founders quit before it compounds.
        </h2>
        <p className="section-p rv d2">
          Oxecute is built around what happens when you don&apos;t. The longer you execute, the more
          the record says without you having to say anything. Founding cohort pricing locks at
          sign-up. Whatever changes later, your terms don&apos;t.
        </p>

        <div className="arc-row rv d2">
          <div className="arc-card">
            <div className="arc-day">Unlocks at 1 day executed</div>
            <div className="arc-name">Commit</div>
            <div className="arc-features">
              {[
                "Private execution journal",
                "Paste a link. It locks. Forever.",
                "Conexa reads your pattern from your entries",
                "Tamper-proof, append-only ledger",
                "Signal Score starts building",
              ].map((t) => (
                <div key={t} className="af">
                  <span className="af-dot" aria-hidden />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="arc-card">
            <div className="arc-day">Unlocks at 21 days executed</div>
            <div className="arc-name">Builder</div>
            <div className="arc-features">
              {[
                "Full Conexa intelligence",
                "Daily Directive: one move, every day",
                "Complete submission history",
                "Breaks don&apos;t reset your score",
                "Export your record",
              ].map((t) => (
                <div key={t} className="af">
                  <span className="af-dot" aria-hidden />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="arc-card">
            <div className="arc-coming">Coming soon</div>
            <div className="arc-day">Unlocks at 45 days executed</div>
            <div className="arc-name">Operator</div>
            <div className="arc-features">
              {[
                "See what your cohort is actually shipping",
                "Real product-to-distribution ratio",
                "Match with founders in your niche",
                "Learn from execution patterns, not claims",
              ].map((t) => (
                <div key={t} className="af">
                  <span className="af-dot" aria-hidden />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="arc-card">
            <div className="arc-coming">Coming soon</div>
            <div className="arc-day">Unlocks at 60 days executed</div>
            <div className="arc-name">Signal</div>
            <div className="arc-features">
              {[
                "Browse investor profiles",
                "Verified Signal badge",
                "Founder profile goes public — your terms",
                "Hiring integrations",
              ].map((t) => (
                <div key={t} className="af">
                  <span className="af-dot" aria-hidden />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="arc-card">
            <div className="arc-coming">Coming soon</div>
            <div className="arc-day">Unlocks at 90 days executed</div>
            <div className="arc-name">Legacy</div>
            <div className="arc-features">
              {[
                "Fund matchmaking",
                "Signal PDF export",
                "Founding pricing locked for life",
                "Permanent record. Yours forever.",
              ].map((t) => (
                <div key={t} className="af">
                  <span className="af-dot" aria-hidden />
                  {t}
                </div>
              ))}
            </div>
            <div className="arc-foot">Execution becomes the credential.</div>
          </div>
        </div>
      </section>

      <section className="inv-section" id="investors">
        <div>
          <div className="inv-eye rv">Investor View</div>
          <h2 className="inv-h rv d1">
            What investors see,
            <br />
            when you choose
            <br />
            to share.
          </h2>
          <p className="inv-body rv d2">
            <strong>Private by default. Always.</strong>
          </p>
          <p className="inv-body rv d2">
            When you opt into investor visibility, what they see is a tamper-proof record of
            verified execution — not a pitch deck, not a Notion doc, not a self-reported claim.
          </p>
          <p className="inv-body rv d3">
            Shipping cadence. Product-vs-distribution ratio. Breaks. What compounded over time.
          </p>
          <div className="inv-quote rv d3">
            <p>
              It&apos;s not a replacement for the warm intro. It&apos;s what makes the warm intro
              convert.
            </p>
          </div>
        </div>

        <InvRecordGrid />
      </section>

      <section className="faq-section" id="FAQ">
        <div className="faq-wrap">
          <div>
            <div className="section-eye rv">Questions</div>
            <div className="faq-intro-h rv d1">Frequently asked questions.</div>
            <p className="faq-intro-p rv d2">
              Short answers to how the record, Conexa, and privacy work.
            </p>
          </div>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div key={item.q} className="faq-item">
                <button
                  type="button"
                  className={`faq-btn ${faqOpen === i ? "open" : ""}`}
                  onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}
                >
                  {item.q}
                  <div className="faq-icon">+</div>
                </button>
                <div className={`faq-body ${faqOpen === i ? "vis" : ""}`}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2 className="cta-h rv">
          Your work is already real.
          <br />
          Now make it undeniable.
        </h2>
        <p className="cta-p rv d1">
          {MARKETING_HERO_STATS.founders} founders on the waitlist. Founding cohort pricing locks at sign-up.
        </p>
        <div className="cta-btns rv d2">
          <button type="button" className="btn-cta-lg" onClick={storePrefillAndStart}>
            Join the founding cohort
          </button>
        </div>
        <div className="cta-trust rv d3">
          <span>No credit card</span>
          <span className="cta-trust-sep" aria-hidden>
            ·
          </span>
          <span>Private by default</span>
          <span className="cta-trust-sep" aria-hidden>
            ·
          </span>
          <span>Founding terms locked at sign-up</span>
        </div>
      </section>

      <footer>
        <Link href="/" className="ei-footer-logo" aria-label="Oxecute home">
          <img src="/brand/logo-icon.svg" alt="" width={40} height={48} className="h-12 w-10 object-contain" decoding="async" />
        </Link>
        <div className="f-links">
          <a className="f-link" href="#hiw">
            How it works
          </a>
          <a className="f-link" href="#investors">
            Angels
          </a>
          <Link className="f-link" href="/privacy">
            Privacy
          </Link>
          <Link className="f-link" href="/terms">
            Terms
          </Link>
        </div>
        <div className="f-legal">© 2026 Oxecute</div>
      </footer>
    </div>
  );
}

function InvRecordGrid() {
  return (
    <div className="inv-record rv d2">
      <div className="irc-top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="irc-av">AR</div>
          <div>
            <div className="irc-name">Emily Blundell</div>
            <div className="irc-sub">oxecute.com/emily · United Kingdom</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div className="irc-badge">
            <div className="irc-pulse" />
            VERIFIED · DAY 53
          </div>
          <button type="button" className="irc-save">
            Save record
          </button>
        </div>
      </div>

      <div className="irc-stats">
        <div className="irc-stat">
          <div
            className="irc-sv"
            style={{
              background: "linear-gradient(135deg,#A5B4FC,#4F46E5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            53
          </div>
          <div className="irc-sk">Signal Score</div>
        </div>
        <div className="irc-stat">
          <div
            className="irc-sv"
            style={{
              background: "linear-gradient(135deg,#6EE7B7,#10B981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            91%
          </div>
          <div className="irc-sk">Execution Rate</div>
        </div>
        <div className="irc-stat">
          <div className="irc-sv">49</div>
          <div className="irc-sk">Verified Proofs</div>
        </div>
        <div className="irc-stat">
          <div className="irc-sv" style={{ color: "#F59E0B" }}>
            84%
          </div>
          <div className="irc-sk">Response Rate</div>
        </div>
      </div>

      <div className="irc-chart-wrap">
        <div className="irc-chart-label">Execution cadence · last 8 weeks</div>
        <svg width="100%" height="54" viewBox="0 0 480 54" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ei-cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,42 L60,36 L120,30 L180,38 L240,18 L300,22 L360,10 L420,6 L480,4 L480,54 L0,54 Z"
            fill="url(#ei-cg)"
          />
          <path
            d="M0,42 L60,36 L120,30 L180,38 L240,18 L300,22 L360,10 L420,6 L480,4"
            fill="none"
            stroke="#A5B4FC"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="480" cy="4" r="3.5" fill="#A5B4FC" />
        </svg>
        <div className="irc-chart-weeks">
          {["Mar", "Apr W1", "Apr W2", "Apr W3", "Apr W4", "May W1", "May W2", "Now"].map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
      </div>

      <div className="irc-grid-wrap">
        <div className="irc-chart-label">Execution record · last 30 days</div>
        <div className="irc-grid">
          {IRC_GRID_TYPES.map((t, idx) => {
            const isLaunch = t === "launch";
            const isBreak = t === "break";
            return (
              <div
                key={`irc-${idx}`}
                className="irc-cell"
                style={{
                  background: IRC_COLORS[t] as string,
                  ...(isLaunch ? { boxShadow: "0 0 6px rgba(16,185,129,0.5)" } : {}),
                  ...(isBreak ? { border: "1px solid rgba(255,255,255,0.08)" } : {}),
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="irc-ev-pad">
        <div className="iev">
          <div className="iev-ico" style={{ background: "rgba(255,255,255,0.07)" }}>
            ⌥
          </div>
          <div className="iev-txt">Build · 4 commits / week · 49-day record</div>
          <div className="iev-tag">logged</div>
        </div>
        <div className="iev" style={{ marginTop: 6 }}>
          <div className="iev-ico" style={{ background: "rgba(79,70,229,0.14)", color: "#A5B4FC" }}>
            $
          </div>
          <div className="iev-txt">3 revenue events · Builder plan</div>
          <div className="iev-tag">declared</div>
        </div>
        <div className="iev" style={{ marginTop: 6 }}>
          <div className="iev-ico" style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}>
            ◷
          </div>
          <div className="iev-txt">6 investor calls · 340 min total</div>
          <div className="iev-tag">declared</div>
        </div>
      </div>
    </div>
  );
}
