"use client";

import { AmbientParticles } from "@/components/marketing/AmbientParticles";
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
  build: "rgba(99,102,241,0.7)",
  strategy: "rgba(139,92,246,0.65)",
  external: "rgba(16,185,129,0.7)",
  audit: "rgba(245,158,11,0.7)",
  spec: "rgba(99,102,241,0.35)",
  break: "rgba(255,255,255,0.04)",
  launch: "linear-gradient(135deg,#10B981,#6366F1)",
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

export function ExecutionIntelligenceLanding() {
  const router = useRouter();
  const navRef = useRef<HTMLElement | null>(null);
  const [h1Text, setH1Text] = useState("");
  const [showCursor, setShowCursor] = useState(true);
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
  const [mStats, setMStats] = useState({
    founders: 127,
    countries: 12,
    spotsRemaining: 50,
  });

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

  const prevSlide = useCallback(() => {
    goCarousel((carouselIdx + 2) % 3);
  }, [carouselIdx, goCarousel]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide]);

  useEffect(() => {
    const full = "Hello Founder";
    let i = 0;
    const timeouts: number[] = [];
    const tick = () => {
      if (i <= full.length) {
        setH1Text(full.slice(0, i));
        const delay = i === 0 ? 500 : 75;
        i += 1;
        timeouts.push(window.setTimeout(tick, delay));
      } else {
        timeouts.push(
          window.setTimeout(() => {
            setShowCursor(false);
            setHeroReveal(true);
          }, 700),
        );
      }
    };
    tick();
    return () => timeouts.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    void fetch("/api/marketing/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { founders?: number; countries?: number; spotsRemaining?: number }) => {
        setMStats((s) => ({
          founders: typeof j.founders === "number" ? j.founders : s.founders,
          countries: typeof j.countries === "number" ? j.countries : s.countries,
          spotsRemaining:
            typeof j.spotsRemaining === "number" ? j.spotsRemaining : s.spotsRemaining,
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const nav = navRef.current;
      if (!nav) return;
      nav.style.background =
        window.scrollY > 30 ? "rgba(8,9,16,0.96)" : "rgba(8,9,16,0.8)";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
      <nav ref={navRef} style={{ background: "rgba(8, 9, 16, 0.8)" }}>
        <Link href="/" className="logo">
          oxecute
        </Link>
        <div className="nav-mid">
          <a className="nl" href="#hiw">
            How it Works
          </a>
          <a className="nl" href="#investors">
            Angels
          </a>
          <a className="nl" href="#FAQ">
            FAQ
          </a>
        </div>
        <div className="nav-right">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/start" className="btn-primary">
            Sign Up
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-glow-l" aria-hidden />
        <div className="hero-glow-r" aria-hidden />

        <div className="hero-l">
          <div className="hero-ticker">
            <div className="ticker-live">Beta Live</div>
            <span className="ticker-sep">
              ·
            </span>
            <div className="ticker-stat">
              <span>{mStats.founders}</span> Founders
            </div>
            <span className="ticker-sep">
              ·
            </span>
            <div className="ticker-stat">
              <span>{mStats.countries}</span> Countries
            </div>
            <span className="ticker-sep">
              ·
            </span>
            <div className="ticker-spots">{mStats.spotsRemaining} Spots Remaining</div>
          </div>

          <h1 className="hero-h1">
            {h1Text}
            {showCursor ? <span className="cursor" /> : null}
          </h1>

          <p className={`hero-body ${heroReveal ? "vis" : ""}`}>
            You&apos;re building daily.
            <br />
            <strong className="hero-body-line-lg">You can&apos;t tell if it&apos;s working.</strong>
            <br />
            <br />
            Log what you shipped today. Conexa reads the pattern and tells you what&apos;s working,
            what you&apos;re avoiding, and what to do next. Every day you execute, the record
            builds.
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
              Join the Founding Cohort <span className="cta-arrow">→</span>
            </button>
            <div className="or-row">or</div>
            <button type="button" className="btn-google" onClick={() => void googleStart()}>
              <span className="g-icon" />
              Continue with Google
            </button>
          </div>

          <div className={`trust-row ${heroReveal ? "vis" : ""}`}>
            <div className="trust-item">* Free to start. Pay when you&apos;re ready.</div>
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
                              background: "rgba(99,102,241,0.14)",
                              color: "#818CF8",
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
                                <stop offset="0%" stopColor="#6366F1" />
                                <stop offset="100%" stopColor="#8B5CF6" />
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
                                    background: "linear-gradient(90deg,#6366F1,#8B5CF6)",
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
                          <div className="prof-name">Ashwini Rathod</div>
                          <div className="prof-role">Founder · Oxecute · Goa, IN</div>
                        </div>
                        <div className="verified-badge">✓ Verified Signal</div>
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
                          <span className="ev-ck">✓</span> Shipping cadence · 4.2 commits/week
                          <span className="ev-tag">auto-captured</span>
                        </div>
                        <div className="ev">
                          <span className="ev-ck">✓</span> Revenue signal · 3 Stripe events
                          <span className="ev-tag">verified</span>
                        </div>
                        <div className="ev">
                          <span className="ev-ck">✓</span> Investor calls · 6 logged
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
              <div className="c-arrows">
                <button type="button" className="c-arr" onClick={prevSlide} aria-label="Previous">
                  ←
                </button>
                <button type="button" className="c-arr" onClick={nextSlide} aria-label="Next">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hiw" id="hiw">
        <div className="section-eye rv">Execution Arc</div>
        <h2 className="section-h rv d1">
          Execution compounds.
          <br />
          Most founders quit before it shows.
        </h2>
        <p className="section-p rv d2">
          Oxecute is built around the days when building actually starts to pay off. Log what you
          execute every day. The record compounds. Founding cohort pricing locks at sign-up —
          whatever changes later, you keep these terms forever.
        </p>

        <div className="arc-row rv d2">
          <div className="arc-card">
            <div className="arc-day">Day 1 of Execution</div>
            <div className="arc-name">Free</div>
            <div className="arc-features">
              {[
                "Private execution journal",
                "Paste a link. It locks. Forever.",
                "Conexa reads your pattern from day 1",
                "Tamper-proof, append-only ledger",
                "Signal Score starts building",
              ].map((t) => (
                <div key={t} className="af">
                  <div className="af-ck">✓</div>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="arc-card">
            <div className="arc-day">21 Days of Execution</div>
            <div className="arc-name">Builder</div>
            <div className="arc-features">
              {[
                "Full Conexa intelligence",
                "Daily Directive: one move, every day",
                "Complete submission history",
                "Breaks don't reset your score",
                "Export your record",
              ].map((t) => (
                <div key={t} className="af">
                  <div className="af-ck">✓</div>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="arc-card">
            <div className="arc-coming">Coming Soon</div>
            <div className="arc-day">45 Days of Execution</div>
            <div className="arc-name">Operator</div>
            <div className="arc-features">
              {[
                "See what your cohort is actually shipping",
                "Real product-to-distribution ratio",
                "Match with founders in your niche",
                "Learn from execution patterns, not claims",
              ].map((t) => (
                <div key={t} className="af">
                  <div className="af-ck">✓</div>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="arc-card">
            <div className="arc-coming">Coming Soon</div>
            <div className="arc-day">60 Days of Execution</div>
            <div className="arc-name">Signal</div>
            <div className="arc-features">
              {[
                "Browse investor profiles",
                "VERIFIED SIGNAL badge",
                "Founder profile goes public — your terms",
                "Hiring integrations",
              ].map((t) => (
                <div key={t} className="af">
                  <div className="af-ck">✓</div>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="arc-card">
            <div className="arc-coming">Coming Soon</div>
            <div className="arc-day">90 Days of Execution</div>
            <div className="arc-name">Permanent</div>
            <div className="arc-features">
              {[
                "Fund matchmaking",
                "Signal PDF export",
                "Founding pricing locked for life",
                "Permanent record. Yours forever.",
              ].map((t) => (
                <div key={t} className="af">
                  <div className="af-ck">✓</div>
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
              If it&apos;s not here, ask Conexa directly — it reads your ledger and gives you
              something real.
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
          Make it visible <span className="g">on your terms.</span>
        </h2>
        <p className="cta-p rv d1">
          {mStats.founders} founders waitlisted. Founding cohort pricing locks at sign-up — forever.
        </p>
        <div className="cta-btns rv d2">
          <button type="button" className="btn-cta-lg" onClick={storePrefillAndStart}>
            Join the Founding Cohort <span className="cta-arrow">→</span>
          </button>
          <a className="btn-ghost" style={{ padding: "12px 22px", fontSize: 14 }} href="#hiw">
            How it Works
          </a>
        </div>
        <div className="cta-trust rv d3">
          <span>
            <span className="ct-ck">✓</span> No credit card
          </span>
          <span>
            <span className="ct-ck">✓</span> Private by default
          </span>
          <span>
            <span className="ct-ck">✓</span> Founding terms locked at sign-up
          </span>
        </div>
      </section>

      <footer>
        <div className="f-logo">oxecute</div>
        <div className="f-links">
          <a className="f-link" href="#hiw">
            How it Works
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
        <div className="f-legal">© 2026 Oxecute · House of ATAH Pvt. Ltd.</div>
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
            <div className="irc-name">Ashwini Rathod</div>
            <div className="irc-sub">oxecute.com/ashwinni &nbsp;·&nbsp; Building since Mar 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div className="irc-badge">
            <div className="irc-pulse" />
            VERIFIED · DAY 53
          </div>
          <button type="button" className="irc-save">
            ↓ Save record
          </button>
        </div>
      </div>

      <div className="irc-stats">
        <div className="irc-stat">
          <div
            className="irc-sv"
            style={{
              background: "linear-gradient(135deg,#A5B4FC,#818CF8)",
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
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,42 L60,36 L120,30 L180,38 L240,18 L300,22 L360,10 L420,6 L480,4 L480,54 L0,54 Z"
            fill="url(#ei-cg)"
          />
          <path
            d="M0,42 L60,36 L120,30 L180,38 L240,18 L300,22 L360,10 L420,6 L480,4"
            fill="none"
            stroke="#818CF8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="480" cy="4" r="3.5" fill="#818CF8" />
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
          <div className="iev-ico" style={{ background: "rgba(99,102,241,0.14)", color: "#818CF8" }}>
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
