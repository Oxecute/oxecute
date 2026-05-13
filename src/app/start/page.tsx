"use client";

import { createClient } from "@/lib/supabase/client";
import { oauthRedirectUrl } from "@/lib/auth/oauth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const FOUND_US = [
  "Reddit",
  "X (Twitter)",
  "LinkedIn",
  "Word of mouth",
  "Search",
  "Other",
] as const;

/** Screen 4 - one card at a time (brief). */
const CALIBRATION_STEPS = [
  {
    tag: "SHIPPED",
    question: "What have you already built or shipped?",
    placeholder:
      "A landing page, an MVP, a first feature, a prototype - anything that exists and can be seen or used.",
    maxLen: 100,
  },
  {
    tag: "CUSTOMERS",
    question:
      "Have you spoken to any potential customers? What did you learn?",
    placeholder:
      "How many conversations, what they said, what surprised you, what they are actually paying for today.",
    maxLen: 100,
  },
  {
    tag: "ELIMINATED",
    question: "What have you already tried that did not work?",
    placeholder:
      "Channels, features, pricing, messaging - anything you tested and abandoned, and why.",
    maxLen: 100,
  },
  {
    tag: "TRACTION",
    question: "Do you have any early traction?",
    placeholder:
      "Users, revenue, waitlist, LOIs, pilots - anything. Numbers only. Zero is a valid answer.",
    maxLen: 500,
  },
  {
    tag: "30-DAY UNKNOWN",
    question:
      "What is the one thing you need to figure out in the next 30 days to know this is worth continuing?",
    placeholder: "The single most important unknown right now.",
    maxLen: 500,
  },
] as const;

const CAL_FIELDS = ["q1", "q2", "q3", "q4", "q5"] as const;

const PENDING_BOOTSTRAP_KEY = "oxecute_pending_bootstrap";

type PendingBootstrap = {
  v: 1;
  full_name: string;
  email: string;
  country: string;
  startup_name: string;
  found_us: string;
  ref_code: string | null;
};

function readPendingBootstrap(): PendingBootstrap | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PENDING_BOOTSTRAP_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as PendingBootstrap;
    if (p.v !== 1 || typeof p.email !== "string") return null;
    return p;
  } catch {
    return null;
  }
}

function savePendingBootstrap(payload: Omit<PendingBootstrap, "v">) {
  localStorage.setItem(
    PENDING_BOOTSTRAP_KEY,
    JSON.stringify({ v: 1, ...payload }),
  );
}

function clearPendingBootstrap() {
  localStorage.removeItem(PENDING_BOOTSTRAP_KEY);
}

export default function StartPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(2);
  /** False until we finish first auth + /api/me (or pending bootstrap) resolution */
  const [booting, setBooting] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [startupName, setStartupName] = useState("");
  const [foundUs, setFoundUs] = useState<string>(FOUND_US[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [hasAuthSession, setHasAuthSession] = useState(false);

  const [stage, setStage] = useState("Building");
  const [mrr, setMrr] = useState("Pre-revenue");
  const [description, setDescription] = useState("");
  const [contextTooShort, setContextTooShort] = useState(false);

  const [calI, setCalI] = useState(0);
  const [cal, setCal] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
  });

  const [synthesis, setSynthesis] = useState<string[]>([]);
  const [synthShown, setSynthShown] = useState(0);

  const [blocker, setBlocker] = useState("");
  const [avoid, setAvoid] = useState<string[]>([]);

  const [activation, setActivation] = useState<{
    tabs: Record<string, string>;
    personal_insight: string;
  } | null>(null);
  const [actShown, setActShown] = useState(0);

  const [firstPath, setFirstPath] = useState<"verified" | "declaration" | "signup">(
    "verified",
  );
  const [proofUrl, setProofUrl] = useState("");
  const [decl, setDecl] = useState("");
  const [workCat, setWorkCat] = useState<"product" | "distribution" | "ops">("product");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem(
        "oxecute_ref_code",
        JSON.stringify({ code: ref, t: Date.now() }),
      );
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "landing_viewed",
        properties: { source: "web", has_ref_code: !!ref },
        session_id: "web",
      }),
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromUser(u: Record<string, unknown>) {
      setFullName(String(u.full_name ?? ""));
      setEmail(String(u.email ?? ""));
      setCountry(String(u.country ?? ""));
      setStartupName(String(u.startup_name ?? ""));
      setFoundUs(String(u.found_us ?? FOUND_US[0]) as (typeof FOUND_US)[number]);

      setStage(String(u.stage ?? "Building"));
      setMrr(String(u.mrr ?? "Pre-revenue"));
      setDescription(String(u.startup_description ?? ""));

      setCal({
        q1: String(u.cal_q1_shipped ?? ""),
        q2: String(u.cal_q2_customers ?? ""),
        q3: String(u.cal_q3_didnt_work ?? ""),
        q4: String(u.cal_q4_traction ?? ""),
        q5: String(u.cal_q5_unknown ?? ""),
      });

      setBlocker(String(u.blocker_text ?? ""));
      setAvoid(
        Array.isArray(u.avoidance_tags)
          ? (u.avoidance_tags as string[])
          : [],
      );

      const desc = String(u.startup_description ?? "");
      if (desc.length < 80) {
        setStep(3);
        return;
      }

      const locked = Boolean(u.calibration_locked);
      const q1ok = String(u.cal_q1_shipped ?? "").trim().length > 0;
      const q5ok = String(u.cal_q5_unknown ?? "").trim().length > 0;
      if (!locked && (!q1ok || !q5ok)) {
        setCalI(0);
        setStep(4);
        return;
      }

      if (!locked) {
        setStep(5);
        setSynthShown(0);
        setSynthesis([]);
        void (async () => {
          try {
            const syn = await fetch("/api/conexa/synthesis", { method: "POST" });
            const j = await syn.json();
            const stmts: string[] = j.statements ?? [];
            setSynthesis(stmts);
            let i = 0;
            const iv = setInterval(() => {
              i += 1;
              setSynthShown(Math.min(i, stmts.length));
              if (i >= stmts.length) clearInterval(iv);
            }, 300);
          } catch {
            setSynthesis([
              "We couldn’t generate synthesis just now.",
              "Your answers are saved — use “Edit my answers” or refresh.",
              "",
              "",
              "",
            ]);
            setSynthShown(5);
          }
        })();
        return;
      }

      const blockerOk = String(u.blocker_text ?? "").trim().length > 0;
      const tags = Array.isArray(u.avoidance_tags)
        ? (u.avoidance_tags as string[])
        : [];
      if (!blockerOk || tags.length === 0) {
        setStep(6);
        return;
      }

      if (!u.conexa_day1_at) {
        setStep(7);
        setActShown(0);
        setActivation(null);
        void (async () => {
          try {
            const act = await fetch("/api/conexa/activation", { method: "POST" });
            const j = await act.json();
            setActivation({
              tabs: j.tabs ?? {},
              personal_insight: String(j.personal_insight ?? ""),
            });
            setActShown(6);
          } catch {
            setActivation({
              tabs: {},
              personal_insight:
                "Conexa could not load this read. Check your connection and refresh this page.",
            });
            setActShown(6);
          }
        })();
        return;
      }

      const execCount = Number(u.execution_count ?? 0);
      if (execCount >= 1) {
        router.push("/dashboard");
        return;
      }

      setStep(8);
    }

    async function resolveAuth() {
      if (cancelled) return;

      setBooting(true);
      const meRes = await fetch("/api/me", { credentials: "same-origin" });
      if (cancelled) return;

      if (meRes.status === 401) {
        setBooting(false);
        setStep(2);
        setHasAuthSession(false);
        return;
      }

      if (meRes.ok) {
        const { user: row } = await meRes.json();
        setErr(null);
        setHasAuthSession(false);
        await hydrateFromUser(row as Record<string, unknown>);
        setBooting(false);
        return;
      }

      if (meRes.status !== 404) {
        setBooting(false);
        setErr("Could not load account status. Refresh the page.");
        return;
      }

      const meBody = (await meRes.json().catch(() => ({}))) as {
        auth_email?: string | null;
        user_metadata?: Record<string, unknown>;
      };
      const authEmail = meBody.auth_email ?? null;
      if (!authEmail) {
        setBooting(false);
        setStep(2);
        setHasAuthSession(false);
        return;
      }

      const emailNorm = authEmail.toLowerCase();
      const pending = readPendingBootstrap();
      if (pending && pending.email.toLowerCase() === emailNorm) {
        const res = await fetch("/api/auth/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: pending.full_name,
            email: pending.email,
            country: pending.country,
            startup_name: pending.startup_name,
            found_us: pending.found_us,
            ref_code: pending.ref_code,
            session_id: "web",
          }),
        });
        if (cancelled) return;

        if (res.ok) {
          clearPendingBootstrap();
          localStorage.removeItem("oxecute_ref_code");
          setHasAuthSession(false);
          const me2 = await fetch("/api/me", { credentials: "same-origin" });
          if (me2.ok) {
            const { user: row } = await me2.json();
            setErr(null);
            await hydrateFromUser(row as Record<string, unknown>);
          } else {
            setStep(3);
            setErr(
              "Profile created but could not load it. Check that Supabase migrations are applied.",
            );
          }
          setBooting(false);
          return;
        }
        const errJson = await res.json().catch(() => ({}));
        setErr(
          typeof errJson.error === "string"
            ? errJson.error
            : "Could not finish signup. Run the SQL migrations in supabase/migrations on your Supabase project, then try again.",
        );
        setBooting(false);
        return;
      }

      const meta = meBody.user_metadata ?? {};
      setEmail(authEmail);
      setFullName(
        (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          "",
      );
      setHasAuthSession(true);
      setStep(2);
      setBooting(false);
    }

    void resolveAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") return;
      void resolveAuth();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  function readRef(): string | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("oxecute_ref_code");
    if (!raw) return null;
    try {
      const { code, t } = JSON.parse(raw) as { code: string; t: number };
      if (Date.now() - t > 30 * 86400000) {
        localStorage.removeItem("oxecute_ref_code");
        return null;
      }
      return code;
    } catch {
      return null;
    }
  }

  async function runIdentity() {
    setBusy(true);
    setErr(null);

    const meProbe = await fetch("/api/me", { credentials: "same-origin" });
    if (meProbe.ok) {
      setBusy(false);
      window.location.assign("/start");
      return;
    }

    if (meProbe.status === 404) {
      const probeJson = (await meProbe.json().catch(() => ({}))) as {
        auth_email?: string | null;
      };
      const authedEmail = probeJson.auth_email;
      if (authedEmail) {
        if (!fullName.trim() || !country.trim() || !startupName.trim()) {
          setErr("Please fill in name, country, and startup name.");
          setBusy(false);
          return;
        }
        if (email.trim().toLowerCase() !== authedEmail.toLowerCase()) {
          setBusy(false);
          setErr("Email must match your signed-in account.");
          return;
        }
        const res = await fetch("/api/auth/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName,
            email: authedEmail,
            country,
            startup_name: startupName,
            found_us: foundUs,
            ref_code: readRef(),
            session_id: "web",
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setErr(j.error || "Bootstrap failed");
          setBusy(false);
          return;
        }
        localStorage.removeItem("oxecute_ref_code");
        setHasAuthSession(false);
        setBusy(false);
        setStep(3);
        return;
      }
    }

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/start`,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      const duplicate =
        msg.includes("already registered") ||
        msg.includes("already been registered") ||
        msg.includes("user already exists");

      if (duplicate && password) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) {
          setBusy(false);
          setErr(
            "This email already has an account. Use the correct password, or open Sign in below.",
          );
          return;
        }
        setHasAuthSession(true);
        setErr(null);
        if (!fullName.trim() || !country.trim() || !startupName.trim()) {
          setBusy(false);
          return;
        }
        const probe = await fetch("/api/me", { credentials: "same-origin" });
        const probeJson = (await probe.json().catch(() => ({}))) as {
          auth_email?: string | null;
        };
        const signedEmail = probeJson.auth_email;
        if (!signedEmail) {
          setBusy(false);
          setErr("Signed in but profile state could not be read. Refresh the page.");
          return;
        }
        const res = await fetch("/api/auth/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName,
            email: signedEmail,
            country,
            startup_name: startupName,
            found_us: foundUs,
            ref_code: readRef(),
            session_id: "web",
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setErr(j.error || "Could not create your profile.");
          setBusy(false);
          return;
        }
        localStorage.removeItem("oxecute_ref_code");
        setHasAuthSession(false);
        setBusy(false);
        setStep(3);
        return;
      }

      setBusy(false);
      if (duplicate) {
        setErr("An account with this email already exists. Sign in - then you can finish onboarding.");
      } else setErr(error.message);
      return;
    }
    if (!data.session) {
      savePendingBootstrap({
        full_name: fullName,
        email,
        country,
        startup_name: startupName,
        found_us: foundUs,
        ref_code: readRef(),
      });
      setErr(
        "Check your email to confirm your account, then sign in. Your details are saved on this device - we'll continue at Context after you sign in.",
      );
      setBusy(false);
      return;
    }
    const res = await fetch("/api/auth/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        country,
        startup_name: startupName,
        found_us: foundUs,
        ref_code: readRef(),
        session_id: "web",
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Bootstrap failed");
      setBusy(false);
      return;
    }
    localStorage.removeItem("oxecute_ref_code");
    setBusy(false);
    setStep(3);
  }

  function trySaveContext() {
    const len = description.trim().length;
    if (len < 80) {
      setContextTooShort(true);
      window.alert(
        `Your description needs at least 80 characters (you have ${len}). Add more detail about what you're building and who it's for.`,
      );
      return;
    }
    setContextTooShort(false);
    void saveContext();
  }

  async function saveContext() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, mrr, startup_description: description.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr("Could not save context");
      return;
    }
    setStep(4);
    setCalI(0);
  }

  async function saveCalibrationAndNext() {
    if (calI < 4) {
      setCalI(calI + 1);
      return;
    }
    setBusy(true);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cal_q1_shipped: cal.q1,
        cal_q2_customers: cal.q2,
        cal_q3_didnt_work: cal.q3,
        cal_q4_traction: cal.q4,
        cal_q5_unknown: cal.q5,
      }),
    });
    setBusy(false);
    setStep(5);
    setSynthShown(0);
    const syn = await fetch("/api/conexa/synthesis", { method: "POST" });
    const j = await syn.json();
    const stmts: string[] = j.statements ?? [];
    setSynthesis(stmts);
    let i = 0;
      const iv = setInterval(() => {
      i += 1;
      setSynthShown(Math.min(i, stmts.length));
      if (i >= stmts.length) clearInterval(iv);
    }, 300);
  }

  async function confirmSynthesis() {
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calibration_locked: true,
        calibration_synthesis: synthesis,
      }),
    });
    setStep(6);
  }

  function editCalibrationFromSynthesis() {
    setErr(null);
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "synthesis_edited",
        properties: { from_step: "synthesis" },
        session_id: "web",
      }),
    });
    setCalI(0);
    setStep(4);
    setSynthesis([]);
    setSynthShown(0);
  }

  async function editCalibrationFromActivation() {
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calibration_locked: false }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(
        typeof j.error === "string"
          ? j.error
          : "Could not unlock CoNexa calibration for editing.",
      );
      setBusy(false);
      return;
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "synthesis_edited",
        properties: { from_step: "activation" },
        session_id: "web",
      }),
    });
    const me = await fetch("/api/me", { credentials: "same-origin" });
    if (me.ok) {
      const { user: u } = await me.json();
      setCal({
        q1: String(u.cal_q1_shipped ?? ""),
        q2: String(u.cal_q2_customers ?? ""),
        q3: String(u.cal_q3_didnt_work ?? ""),
        q4: String(u.cal_q4_traction ?? ""),
        q5: String(u.cal_q5_unknown ?? ""),
      });
    }
    setCalI(0);
    setStep(4);
    setSynthesis([]);
    setSynthShown(0);
    setActivation(null);
    setActShown(0);
    setBusy(false);
  }

  async function saveGap() {
    if (!blocker.trim() || avoid.length === 0) {
      setErr("Complete gap capture");
      return;
    }
    setErr(null);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocker_text: blocker, avoidance_tags: avoid }),
    });
    setStep(7);
    setActShown(0);
    const act = await fetch("/api/conexa/activation", { method: "POST" });
    const j = await act.json();
    setActivation({
      tabs: j.tabs,
      personal_insight: j.personal_insight,
    });
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setActShown(Math.min(i, 6));
      if (i >= 6) clearInterval(iv);
    }, 600);
  }

  async function persistActivationAndGo() {
    if (!activation) return;
    const report = {
      version: "v1.0",
      tabs: activation.tabs,
      personal_insight: activation.personal_insight,
      generated_at: new Date().toISOString(),
    };
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conexa_day1_report: report,
        conexa_day1_at: new Date().toISOString(),
      }),
    });
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "conexa_activation_completed", properties: {} }),
    });
    setStep(8);
  }

  async function submitFirst() {
    setBusy(true);
    setErr(null);
    let body: Record<string, unknown>;
    if (firstPath === "signup") body = { path: "signup" };
    else if (firstPath === "declaration")
      body = { path: "declaration", declaration_text: decl, category: workCat };
    else body = { path: "verified", url: proofUrl, category: workCat };

    const res = await fetch("/api/entries/first", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function signInWithGoogle() {
    setErr(null);
    setBusy(true);
    const redirectTo = oauthRedirectUrl("/start");
    if (!redirectTo) {
      setBusy(false);
      setErr("Could not build redirect URL.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    setBusy(false);
    if (error) setErr(error.message);
  }

  async function signOutAndReset() {
    setErr(null);
    await supabase.auth.signOut();
    setHasAuthSession(false);
    setEmail("");
    setFullName("");
    setPassword("");
  }

  if (booting) {
    return (
      <main
        data-onboarding-surface="true"
        className="min-h-screen bg-[var(--mi)] flex items-center justify-center text-[var(--fw)]"
      >
        Loading…
      </main>
    );
  }

  return (
    <main
      data-onboarding-surface="true"
      className="min-h-screen bg-[var(--mi)] text-[var(--fw)] px-4 py-10 max-w-lg mx-auto"
    >
      <div className="mb-6 flex justify-between text-sm text-[var(--ca)]">
        <Link href="/" className="hover:text-[var(--ac)]">
          ← Home
        </Link>
        {step >= 2 && step <= 7 && (
          <span>
            {hasAuthSession && step === 2
              ? "Finish signup · 1 / 6"
              : `Step ${step - 1} of 6`}
          </span>
        )}
      </div>

      {step === 2 && (
        <div className="space-y-4 glass-card rounded-2xl p-6">
          <h1 className="text-xl font-bold">
            {hasAuthSession ? "Finish your profile" : "Identity"}
          </h1>
          {hasAuthSession ? (
            <p className="text-sm text-[var(--ca)]">
              You&apos;re signed in. Add the details below so we can create your Oxecute profile.
            </p>
          ) : null}
          <input className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 disabled:opacity-60"
            placeholder="Email"
            type="email"
            value={email}
            readOnly={hasAuthSession}
            onChange={(e) => !hasAuthSession && setEmail(e.target.value)}
          />
          {!hasAuthSession ? (
            <input className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          ) : null}
          <input className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
          <input className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" placeholder="Startup name" value={startupName} onChange={(e) => setStartupName(e.target.value)} />
          <label className="block text-sm text-[var(--ca)]">How did you find us?</label>
          <div className="flex flex-wrap gap-2">
            {FOUND_US.map((f) => (
              <button
                key={f}
                type="button"
                className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                  foundUs === f
                    ? "bg-[var(--ac)] text-[var(--mi)] border-[var(--ac)]"
                    : "border-white/25 text-[var(--fw)] hover:border-[var(--ac)]/60"
                }`}
                onClick={() => setFoundUs(f)}
              >
                {f}
              </button>
            ))}
          </div>
          {err && <p className="text-[var(--orange)] text-sm">{err}</p>}
          <button disabled={busy} onClick={runIdentity} className="w-full rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold py-3">
            Continue
          </button>
          {!hasAuthSession ? (
            <>
              <div className="relative flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-[var(--t3)]">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void signInWithGoogle()}
                className="w-full flex items-center justify-center gap-2 rounded-full border border-white/20 bg-black/20 text-[var(--fw)] font-medium py-3 hover:bg-black/30"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </>
          ) : (
            <p className="text-center text-xs text-[var(--t3)]">
              <button type="button" onClick={() => void signOutAndReset()} className="text-[var(--ac)] underline">
                Use a different account
              </button>
            </p>
          )}
          <p className="text-sm text-center text-[var(--ca)]">
            Already have an account? <Link href="/login" className="text-[var(--ac)] underline">Sign in</Link>
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 glass-card rounded-2xl p-6">
          <h1 className="text-xl font-bold">Context</h1>
          <select className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" value={stage} onChange={(e) => setStage(e.target.value)}>
            {["Idea", "Building", "Launched", "Scaling"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" value={mrr} onChange={(e) => setMrr(e.target.value)}>
            {["Pre-revenue", "$1-500", "$500-2K", "$2K-10K", "$10K+"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <textarea
            className={`w-full min-h-[120px] rounded-lg bg-black/30 border px-3 py-2 text-[var(--fw)] placeholder:text-[var(--ca)]/80 ${
              description.trim().length > 0 && description.trim().length < 80
                ? "border-amber-500/50"
                : "border-white/10"
            }`}
            placeholder="What are you building and who is it for? (min 80 chars)"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (e.target.value.trim().length >= 80) setContextTooShort(false);
            }}
          />
          {contextTooShort ? (
            <p className="text-sm rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-100 px-3 py-2" role="alert">
              Needs at least 80 characters before you can continue. Add a bit more about the problem, who it&apos;s for, and what you&apos;re shipping.
            </p>
          ) : null}
          <p
            className={`text-xs ${
              description.trim().length > 0 && description.trim().length < 80
                ? "text-amber-300"
                : "text-[var(--ca)]"
            }`}
          >
            {description.length}/600
            {description.trim().length < 80 ? (
              <span className="block mt-1 text-[var(--ca)]">
                {Math.max(0, 80 - description.trim().length)} more needed (minimum 80).
              </span>
            ) : null}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={trySaveContext}
            className="w-full rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 glass-card rounded-2xl p-6">
          <h1 className="text-xl font-bold">CoNexa Calibration</h1>
          <div className="flex gap-2 justify-center" aria-hidden>
            {CALIBRATION_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full border ${
                  i === calI
                    ? "bg-[var(--ac)] border-[var(--ac)]"
                    : i < calI
                      ? "bg-[var(--p)] border-[var(--p)]"
                      : "border-[var(--t3)] bg-transparent"
                }`}
              />
            ))}
          </div>
          {(() => {
            const meta = CALIBRATION_STEPS[calI];
            const field = CAL_FIELDS[calI];
            const value = cal[field];
            return (
              <>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--ac)]/80">
                  {meta.tag}
                </p>
                <p className="text-base font-semibold text-[var(--fw)] leading-snug">
                  {meta.question}
                </p>
                <textarea
                  className="w-full min-h-[120px] rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[var(--fw)] placeholder:text-[var(--t3)]"
                  placeholder={meta.placeholder}
                  maxLength={meta.maxLen}
                  value={value}
                  onChange={(e) =>
                    setCal({ ...cal, [field]: e.target.value })
                  }
                />
                <p className="text-xs text-[var(--t3)]">
                  {value.length}/{meta.maxLen}
                  {calI >= 1 && calI <= 3
                    ? " · '0' or 'none' is fine if that's accurate"
                    : null}
                </p>
              </>
            );
          })()}
          <button
            onClick={saveCalibrationAndNext}
            disabled={
              busy ||
              (calI === 0 && cal.q1.trim().length < 1) ||
              (calI === 4 && cal.q5.trim().length < 1)
            }
            className="w-full rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold py-3"
          >
            {calI === 4 ? "Complete CoNexa calibration →" : "Next question →"}
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 glass-card rounded-2xl p-6">
          <h1 className="text-xl font-bold">Synthesis</h1>
          <div className="space-y-3">
            {synthesis.slice(0, synthShown).map((s, i) => (
              <p key={i} className="text-sm border border-white/10 rounded-lg p-3 bg-black/20">
                {s}
              </p>
            ))}
          </div>
          <button disabled={synthShown < 5} onClick={() => void confirmSynthesis()} className="w-full rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold py-3">
            Yes, continue →
          </button>
          <button
            type="button"
            disabled={synthShown < 5}
            onClick={editCalibrationFromSynthesis}
            className="w-full rounded-full border border-white/25 text-[var(--fw)] font-medium py-3 hover:bg-white/5"
          >
            Edit my answers
          </button>
          <p className="text-xs text-center text-[var(--t3)]">
            You&apos;ll return to the 5 CoNexa calibration questions, then see a fresh synthesis.
          </p>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4 glass-card rounded-2xl p-6">
          <h1 className="text-xl font-bold">Gap capture</h1>
          <textarea className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" maxLength={140} placeholder="Biggest blocker" value={blocker} onChange={(e) => setBlocker(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {[
              "Product work",
              "Talking to customers",
              "Fundraising",
              "Hiring",
              "Marketing and distribution",
              "Operations",
              "Nothing yet",
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                className={`text-xs px-3 py-1 rounded-full border ${avoid.includes(tag) ? "bg-[var(--ac)] text-[var(--mi)]" : "border-white/20"}`}
                onClick={() => {
                  if (tag === "Nothing yet") setAvoid(["Nothing yet"]);
                  else setAvoid((a) => [...a.filter((x) => x !== "Nothing yet"), tag]);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <button onClick={saveGap} className="w-full rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold py-3">
            Continue
          </button>
        </div>
      )}

      {step === 7 && !activation && (
        <div className="space-y-4 glass-card rounded-2xl p-6 text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--ac)]/80">
            Conexa
          </p>
          <p className="text-sm text-[var(--ca)]">Preparing your execution read…</p>
          <div className="flex justify-center py-4">
            <span className="inline-block h-8 w-8 rounded-full border-2 border-[var(--ac)] border-t-transparent animate-spin" />
          </div>
        </div>
      )}

      {step === 7 && activation && (
        <div className="space-y-4 glass-card rounded-2xl p-6">
          <p className="text-xs tracking-widest text-[var(--ac)]">CONEXA · EXECUTION INTELLIGENCE</p>
          <div className="space-y-2 text-sm">
            {[
              ["The Reality Check", activation.tabs.reality_check],
              ["The Blindspot", activation.tabs.blindspot],
              ["Shipping vs. Noise", activation.tabs.shipping_vs_noise],
              ["The Next Move", activation.tabs.next_move],
              ["The Integrity Forecast", activation.tabs.integrity_forecast],
              ["Executive Synthesis", activation.tabs.executive_synthesis],
            ].slice(0, actShown).map(([t, b], i) => (
              <div key={i} className="border border-white/10 rounded-lg p-3">
                <p className="font-semibold text-[var(--ac)] mb-1">{t}</p>
                <p className="text-[var(--ca)]">{String(b ?? "")}</p>
              </div>
            ))}
          </div>
          {actShown >= 6 && (
            <>
              <p className="text-sm">{activation.personal_insight}</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void editCalibrationFromActivation()}
                className="w-full rounded-full border border-white/25 text-[var(--fw)] font-medium py-3 hover:bg-white/5 disabled:opacity-50"
              >
                Edit CoNexa calibration answers
              </button>
              <p className="text-xs text-[var(--t3)]">
                Reopens the 5 questions, then synthesis, gap capture, and this Conexa read run again with your updates.
              </p>
              <button onClick={persistActivationAndGo} className="w-full rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold py-3">
                Start my record →
              </button>
            </>
          )}
        </div>
      )}

      {step === 8 && (
        <div className="space-y-4 glass-card rounded-2xl p-6">
          <h1 className="text-xl font-bold">First Entry</h1>
          <div className="space-y-2">
            <button type="button" className={`w-full text-left p-3 rounded-lg border ${firstPath === "verified" ? "border-[var(--ac)]" : "border-white/10"}`} onClick={() => setFirstPath("verified")}>
              Verified Proof
            </button>
            <button type="button" className={`w-full text-left p-3 rounded-lg border ${firstPath === "declaration" ? "border-[var(--ac)]" : "border-white/10"}`} onClick={() => setFirstPath("declaration")}>
              Declaration
            </button>
            <button type="button" className={`w-full text-left p-3 rounded-lg border ${firstPath === "signup" ? "border-[var(--ac)]" : "border-white/10"}`} onClick={() => setFirstPath("signup")}>
              Nothing to submit (Path B)
            </button>
          </div>
          {firstPath === "verified" && (
            <input className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" placeholder="https://…" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} />
          )}
          {firstPath === "declaration" && (
            <textarea className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" value={decl} onChange={(e) => setDecl(e.target.value)} />
          )}
          <select className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" value={workCat} onChange={(e) => setWorkCat(e.target.value as typeof workCat)}>
            <option value="product">Product</option>
            <option value="distribution">Distribution</option>
            <option value="ops">Ops</option>
          </select>
          {err && <p className="text-[var(--orange)] text-sm">{err}</p>}
          <button disabled={busy} onClick={submitFirst} className="w-full rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold py-3">
            Lock entry →
          </button>
        </div>
      )}
    </main>
  );
}
