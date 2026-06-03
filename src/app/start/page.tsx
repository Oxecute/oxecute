"use client";

import { createClient } from "@/lib/supabase/client";
import { oauthRedirectUrl } from "@/lib/auth/oauth";
import {
  FIRST_PROOF_ACCEPT,
  uploadFirstProofFiles,
} from "@/lib/entry-uploads";
import { getCountryOptions } from "@/lib/country-options";
import "@/app/execution-intelligence.css";
import { AuthMobileHelp } from "@/components/auth-mobile-help";
import {
  CalibrationLoadingState,
  CalibrationQuestionCard,
  CalibrationSidebar,
  MobileStepPills,
} from "@/components/onboarding/calibration";
import type { OnboardingFlowPhase } from "@/components/onboarding/calibration";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const FOUND_US = [
  "Reddit",
  "X (Twitter)",
  "LinkedIn",
  "Word of mouth",
  "Search",
  "Other",
] as const;

/** Conexa calibration: 3 questions → stored as Q1, Q3, Q5 (Q2/Q4 cleared on save). */
const CALIBRATION_STEPS = [
  {
    field: "q1" as const,
    tag: "RECENT",
    question: "What have you shipped or done in the last 7 days?",
    helper:
      "Actual things. Code pushed, calls made, revenue collected, content posted. If it was nothing, say that.",
    placeholder:
      "e.g. Shipped the auth flow, had 3 founder calls, posted on Reddit and got 12 DMs",
    maxLen: 250,
  },
  {
    field: "q3" as const,
    tag: "AVOID",
    question: "What have you been avoiding that you know matters?",
    helper:
      "The thing that's been on your list for weeks. The conversation you haven't had. The page you haven't shipped.",
    placeholder:
      "e.g. Reaching out to potential customers directly. I keep building features instead.",
    maxLen: 250,
  },
  {
    field: "q5" as const,
    tag: "30-DAY",
    question: "What does success look like in 30 days?",
    helper:
      "Specific and measurable. Not 'grow the product' — what number, what milestone, what moment?",
    placeholder: "e.g. 20 active users submitting daily, 3 paying customers, £500 MRR",
    maxLen: 250,
  },
] as const;

const CAL_LEGACY_EMPTY = { q2: "", q4: "" } as const;
/** Min length per answer when submitting calibration to the API. */
const CAL_MIN_SUBMIT_CHARS = 10;
/** Min length on the previous answer before the next card becomes editable (avoid blocking on silent 10-char rule). */
const CAL_UNLOCK_CHARS = 1;

/** Day 0 activation read: tab 0 open; tabs 1–5 collapsed until the user expands them. */
function defaultDay0TabsCollapsed(): Record<number, boolean> {
  return { 1: true, 2: true, 3: true, 4: true, 5: true };
}

function onboardingFlowPhase(step: number): OnboardingFlowPhase {
  if (step === 2) return "signup";
  if (step === 3) return "startup";
  return "conexa";
}

function conexaSectionSubtitle(step: number): string | undefined {
  if (step < 4 || step > 8) return undefined;
  const labels: Record<number, string> = {
    4: "Three honest answers",
    5: "Calibration synthesis",
    7: "Day 0 read",
    8: "First proof of work",
  };
  return labels[step];
}

/** Maps to existing `stage` / `mrr` DB fields (brief 2.3). */
const STAGE_TILES = [
  {
    id: "idea",
    title: "Idea stage",
    sub: "Still validating",
    stage: "Idea",
    mrr: "Pre-revenue",
  },
  {
    id: "pre_rev",
    title: "Pre-revenue",
    sub: "Building, not charging yet",
    stage: "Building",
    mrr: "Pre-revenue",
  },
  {
    id: "early_rev",
    title: "Early revenue",
    sub: "Under £1K MRR",
    stage: "Launched",
    mrr: "$1-500",
  },
  {
    id: "growing",
    title: "Growing",
    sub: "£1K+ MRR",
    stage: "Scaling",
    mrr: "$10K+",
  },
] as const;

const LANDING_PREFILL_KEY = "oxecute_landing_prefill";

function splitDisplayName(raw: string): { first: string; last: string } {
  const t = raw.trim();
  if (!t) return { first: "", last: "" };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { first: parts[0]!, last: "" };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

const PENDING_BOOTSTRAP_KEY = "oxecute_pending_bootstrap";

type PendingBootstrap = {
  v: 2;
  first_name: string;
  last_name: string;
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
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (p.v === 2 && typeof p.email === "string") {
      return {
        v: 2,
        first_name: String(p.first_name ?? ""),
        last_name: String(p.last_name ?? ""),
        email: p.email,
        country: String(p.country ?? ""),
        startup_name: String(p.startup_name ?? ""),
        found_us: String(p.found_us ?? FOUND_US[0]),
        ref_code: typeof p.ref_code === "string" ? p.ref_code : null,
      };
    }
    if (p.v === 1 && typeof p.full_name === "string" && typeof p.email === "string") {
      const { first, last } = splitDisplayName(String(p.full_name));
      return {
        v: 2,
        first_name: first,
        last_name: last,
        email: p.email,
        country: String(p.country ?? ""),
        startup_name: String(p.startup_name ?? ""),
        found_us: String(p.found_us ?? FOUND_US[0]),
        ref_code: typeof p.ref_code === "string" ? p.ref_code : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function savePendingBootstrap(payload: Omit<PendingBootstrap, "v">) {
  localStorage.setItem(
    PENDING_BOOTSTRAP_KEY,
    JSON.stringify({ v: 2, ...payload }),
  );
}

function clearPendingBootstrap() {
  localStorage.removeItem(PENDING_BOOTSTRAP_KEY);
}

export default function StartPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const countryOptions = useMemo(() => getCountryOptions(), []);
  /** Harden hydrate(): soft auth fires often; avoid re-POSTing synthesis while cal is still unlocked. */
  const openCalSynthHydrateDoneRef = useRef(false);
  const openCalSynthHydrateInFlightRef = useRef(false);
  /** Same for Day-0 activation when returning to /start before conexa_day1_at is set. */
  const day0ActivationHydrateDoneRef = useRef(false);
  const day0ActivationHydrateInFlightRef = useRef(false);
  /** While saving calibration + fetching synthesis, ignore hydrateFromUser so stale /api/me cannot force step back to 4 (loads forever on "reading your pattern"). */
  const calibrationSubmitInFlightRef = useRef(false);
  const [step, setStep] = useState(2);
  /** False until we finish first auth + /api/me (or pending bootstrap) resolution */
  const [booting, setBooting] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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

  const [calSubmitting, setCalSubmitting] = useState(false);
  const [cal, setCal] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
  });

  const [synthesis, setSynthesis] = useState<string[]>([]);
  const [synthShown, setSynthShown] = useState(0);
  /** When `synthCollapsed[i] === true`, insight i is collapsed; unset/false = expanded. */
  const [synthCollapsed, setSynthCollapsed] = useState<Record<number, boolean>>({});
  const [synthLoading, setSynthLoading] = useState(false);

  const [blocker, setBlocker] = useState("");
  const [activation, setActivation] = useState<{
    tabs: Record<string, string>;
    personal_insight: string;
  } | null>(null);
  const [actShown, setActShown] = useState(0);
  /** Day 0 accordion: `true` = collapsed. */
  const [actCollapsed, setActCollapsed] = useState<Record<number, boolean>>({});

  const [firstPath, setFirstPath] = useState<"verified" | "declaration" | "upload" | "signup_execution">(
    "verified",
  );
  const [proofUrl, setProofUrl] = useState("");
  const [decl, setDecl] = useState("");
  const [uploadContext, setUploadContext] = useState("");
  const [uploadProofFiles, setUploadProofFiles] = useState<File[]>([]);
  const [workCat, setWorkCat] = useState<"product" | "distribution" | "ops">("product");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isSubmittedRef = useRef(false);
  const [username, setUsername] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const uploadProofInputRef = useRef<HTMLInputElement>(null);

  const handleChoosePathB = () => {
    setFirstPath("signup_execution");
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "first_entry_path_b", properties: {} }),
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(LANDING_PREFILL_KEY);
      if (!raw) return;
      const j = JSON.parse(raw) as {
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
      };
      if (typeof j.firstName === "string") setFirstName(j.firstName);
      if (typeof j.lastName === "string") setLastName(j.lastName);
      if (typeof j.email === "string") setEmail(j.email);
      if (typeof j.password === "string") setPassword(j.password);
      sessionStorage.removeItem(LANDING_PREFILL_KEY);
    } catch {
      /* ignore */
    }
  }, []);

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
    if (typeof window === "undefined") return;
    const handleBeforeUnload = () => {
      if (step === 4) {
        // Send drop-off event via keepalive fetch so it executes before closing
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "drop_off",
            properties: { last_screen: 4 },
            session_id: "web",
          }),
          keepalive: true,
        });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [step]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromUser(u: Record<string, unknown>) {
      if (calibrationSubmitInFlightRef.current) return;

      const fn = String(u.first_name ?? "").trim();
      const ln = String(u.last_name ?? "").trim();
      const legacy = String(u.full_name ?? "").trim();
      if (fn || ln) {
        setFirstName(fn);
        setLastName(ln);
      } else if (legacy) {
        const sp = splitDisplayName(legacy);
        setFirstName(sp.first);
        setLastName(sp.last);
      } else {
        setFirstName("");
        setLastName("");
      }
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
      setUsername(String(u.username ?? ""));

      const desc = String(u.startup_description ?? "");
      if (desc.trim().length < 50) {
        setStep(3);
        return;
      }

      const locked = Boolean(u.calibration_locked);
      const q1ok =
        String(u.cal_q1_shipped ?? "").trim().length >= CAL_MIN_SUBMIT_CHARS;
      const q3ok =
        String(u.cal_q3_didnt_work ?? "").trim().length >= CAL_MIN_SUBMIT_CHARS;
      const q5ok =
        String(u.cal_q5_unknown ?? "").trim().length >= CAL_MIN_SUBMIT_CHARS;
      if (!locked && (!q1ok || !q3ok || !q5ok)) {
        setStep(4);
        return;
      }

      if (!locked) {
        setStep(5);
        if (openCalSynthHydrateDoneRef.current || openCalSynthHydrateInFlightRef.current) {
          return;
        }
        openCalSynthHydrateInFlightRef.current = true;
        setSynthShown(0);
        setSynthesis([]);
        setSynthLoading(true);
        void (async () => {
          try {
            const syn = await fetch("/api/conexa/synthesis", { method: "POST" });
            const j = await syn.json();
            const stmts: string[] = j.statements ?? [];
            setSynthesis(stmts);
            setSynthCollapsed({});
            let i = 0;
            const iv = setInterval(() => {
              i += 1;
              setSynthShown(Math.min(i, stmts.length));
              if (i >= stmts.length) clearInterval(iv);
            }, 300);
            openCalSynthHydrateDoneRef.current = true;
          } catch {
            setSynthesis([
              "We couldn’t generate synthesis just now.",
              "Your answers are saved — use “Edit my answers” or refresh.",
              "",
            ]);
            setSynthCollapsed({});
            setSynthShown(3);
          } finally {
            setSynthLoading(false);
            openCalSynthHydrateInFlightRef.current = false;
          }
        })();
        return;
      }

      const blockerOk = String(u.blocker_text ?? "").trim().length > 0;
      const tags = Array.isArray(u.avoidance_tags)
        ? (u.avoidance_tags as string[])
        : [];
      if (!blockerOk) {
        setStep(3);
        return;
      }
      if (tags.length === 0) {
        await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ avoidance_tags: ["Nothing yet"] }),
        });
      }

      if (!u.conexa_day1_at) {
        setStep(7);
        if (day0ActivationHydrateDoneRef.current || day0ActivationHydrateInFlightRef.current) {
          return;
        }
        day0ActivationHydrateInFlightRef.current = true;
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
            setActCollapsed(defaultDay0TabsCollapsed());
            setActShown(6);
            day0ActivationHydrateDoneRef.current = true;
          } catch {
            setActivation({
              tabs: {},
              personal_insight:
                "Conexa could not load this read. Check your connection and refresh this page.",
            });
            setActCollapsed(defaultDay0TabsCollapsed());
            setActShown(6);
          } finally {
            day0ActivationHydrateInFlightRef.current = false;
          }
        })();
        return;
      }

      const execCount = Number(u.execution_count ?? 0);
      if (execCount >= 1 && !isSubmittedRef.current) {
        router.push("/dashboard");
        return;
      }

      setStep(8);
    }

    async function resolveAuth(opts?: { soft?: boolean }) {
      if (cancelled) return;

      const soft = Boolean(opts?.soft);
      if (!soft) setBooting(true);
      const meRes = await fetch("/api/me", { credentials: "same-origin" });
      if (cancelled) return;

      if (meRes.status === 401) {
        if (!soft) setBooting(false);
        setStep(2);
        setHasAuthSession(false);
        return;
      }

      if (meRes.ok) {
        const { user: row } = await meRes.json();
        setErr(null);
        setHasAuthSession(false);
        await hydrateFromUser(row as Record<string, unknown>);
        if (!soft) setBooting(false);
        return;
      }

      if (meRes.status !== 404) {
        if (!soft) setBooting(false);
        setErr("Could not load account status. Refresh the page.");
        return;
      }

      const meBody = (await meRes.json().catch(() => ({}))) as {
        auth_email?: string | null;
        user_metadata?: Record<string, unknown>;
      };
      const authEmail = meBody.auth_email ?? null;
      if (!authEmail) {
        if (!soft) setBooting(false);
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
            first_name: pending.first_name,
            last_name: pending.last_name,
            email: pending.email,
            country: pending.country,
            startup_name: pending.startup_name.trim(),
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
          if (!soft) setBooting(false);
          return;
        }
        const errJson = await res.json().catch(() => ({}));
        setErr(
          typeof errJson.error === "string"
            ? errJson.error
            : "Could not finish signup. Run the SQL migrations in supabase/migrations on your Supabase project, then try again.",
        );
        if (!soft) setBooting(false);
        return;
      }

      const meta = meBody.user_metadata ?? {};
      if (!soft) {
        setEmail(authEmail);
        const metaFull =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          "";
        const sp = splitDisplayName(String(metaFull));
        setFirstName(sp.first);
        setLastName(sp.last);
        setHasAuthSession(true);
        setStep(2);
      } else {
        setHasAuthSession(true);
      }
      if (!soft) setBooting(false);
    }

    void resolveAuth();

    let softAuthDebounce: ReturnType<typeof setTimeout> | null = null;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") return;
      /* Mount already runs resolveAuth(); this fires immediately and would double-fetch + flash Loading on mobile. */
      if (event === "INITIAL_SESSION") return;
      if (softAuthDebounce) clearTimeout(softAuthDebounce);
      softAuthDebounce = setTimeout(() => {
        void resolveAuth({ soft: true });
      }, 350);
    });

    return () => {
      cancelled = true;
      if (softAuthDebounce) clearTimeout(softAuthDebounce);
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
        if (!firstName.trim() || !lastName.trim() || !country.trim()) {
          setErr("Please fill in first name, last name, and country.");
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
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: authedEmail,
            country,
            startup_name: "",
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

    if (!hasAuthSession) {
      if (!firstName.trim() || !lastName.trim() || !country.trim()) {
        setErr("Please fill in first name, last name, and country.");
        setBusy(false);
        return;
      }
      if (!email.trim() || !password.trim()) {
        setErr("Please enter your email and password.");
        setBusy(false);
        return;
      }
      if (password.length < 6) {
        setErr("Password must be at least 6 characters.");
        setBusy(false);
        return;
      }
    }

    if (hasAuthSession) {
      setBusy(false);
      setErr("We couldn&apos;t link your session to this step. Refresh the page and try again.");
      return;
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
        if (!firstName.trim() || !lastName.trim() || !country.trim()) {
          setErr("Please fill in first name, last name, and country.");
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
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: signedEmail,
            country,
            startup_name: "",
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
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email,
        country,
        startup_name: "",
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
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email,
        country,
        startup_name: "",
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
    if (!startupName.trim()) {
      window.alert("Add your startup name.");
      return;
    }
    const len = description.trim().length;
    if (len < 50 || len > 500) {
      setContextTooShort(true);
      window.alert(
        len > 500
          ? `Keep this to 500 characters max (you have ${len}).`
          : `Add at least 50 characters (you have ${len}). Describe what you are building and who it is for.`,
      );
      return;
    }
    const stageOk = STAGE_TILES.some((t) => t.stage === stage && t.mrr === mrr);
    if (!stageOk) {
      window.alert("Pick a stage: one of the four tiles.");
      return;
    }
    if (!blocker.trim()) {
      window.alert("What is your biggest blocker right now?");
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
      body: JSON.stringify({
        startup_name: startupName.trim(),
        stage,
        mrr,
        startup_description: description.trim(),
        blocker_text: blocker.trim(),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr("Could not save context");
      return;
    }
    setStep(4);
  }

  async function submitCalibrationReport() {
    if (!CALIBRATION_STEPS.every((s) => cal[s.field].trim().length >= CAL_MIN_SUBMIT_CHARS)) return;
    openCalSynthHydrateDoneRef.current = false;
    calibrationSubmitInFlightRef.current = true;
    setCalSubmitting(true);
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cal_q1_shipped: cal.q1,
          cal_q2_customers: CAL_LEGACY_EMPTY.q2,
          cal_q3_didnt_work: cal.q3,
          cal_q4_traction: CAL_LEGACY_EMPTY.q4,
          cal_q5_unknown: cal.q5,
        }),
      });
      if (!res.ok) {
        setErr("Could not save calibration");
        return;
      }
      setCal((c) => ({ ...c, q2: CAL_LEGACY_EMPTY.q2, q4: CAL_LEGACY_EMPTY.q4 }));
      setStep(5);
      setSynthShown(0);
      setSynthesis([]);
      setSynthCollapsed({});
      setSynthLoading(true);
      const syn = await fetch("/api/conexa/synthesis", { method: "POST" });
      const j = await syn.json();
      let stmts: string[] = j.statements ?? [];
      if (!Array.isArray(stmts) || stmts.filter(Boolean).length < 1) {
        stmts = [
          "We couldn’t load full synthesis.",
          "Your answers are saved — tap “Edit my answers” or refresh.",
          "",
        ];
      }
      while (stmts.length < 3) stmts.push("");
      setSynthesis(stmts);
      setSynthCollapsed({});
      let i = 0;
      const iv = setInterval(() => {
        i += 1;
        setSynthShown(Math.min(i, stmts.length));
        if (i >= stmts.length) clearInterval(iv);
      }, 220);
      openCalSynthHydrateDoneRef.current = true;
    } catch {
      setSynthesis([
        "We couldn’t generate synthesis just now.",
        "Your answers are saved — use “Edit my answers” or refresh.",
        "",
      ]);
      setSynthCollapsed({});
      setSynthShown(3);
    } finally {
      calibrationSubmitInFlightRef.current = false;
      setSynthLoading(false);
      setCalSubmitting(false);
      setBusy(false);
    }
  }

  async function confirmSynthesis() {
    setBusy(true);
    setErr(null);
    try {
      const lockRes = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calibration_locked: true,
          calibration_synthesis: synthesis,
        }),
      });
      if (!lockRes.ok) {
        setErr("Could not save calibration lock");
        return;
      }

      const meRes = await fetch("/api/me", { credentials: "same-origin" });
      if (meRes.ok) {
        const { user: row } = await meRes.json();
        const rowTags = Array.isArray(row.avoidance_tags) ? row.avoidance_tags : [];
        if (rowTags.length === 0) {
          await fetch("/api/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avoidance_tags: ["Nothing yet"] }),
          });
        }
      }

      setStep(7);
      setActShown(0);
      setActivation(null);
      try {
        const act = await fetch("/api/conexa/activation", { method: "POST" });
        const j = await act.json();
        setActivation({
          tabs: j.tabs ?? {},
          personal_insight: String(j.personal_insight ?? ""),
        });
        setActCollapsed(defaultDay0TabsCollapsed());
        let i = 0;
        const iv = setInterval(() => {
          i += 1;
          setActShown(Math.min(i, 6));
          if (i >= 6) clearInterval(iv);
        }, 600);
        day0ActivationHydrateDoneRef.current = true;
      } catch {
        setActivation({
          tabs: {},
          personal_insight:
            "Conexa could not load this read. Check your connection and refresh this page.",
        });
        setActCollapsed(defaultDay0TabsCollapsed());
        setActShown(6);
      }
    } finally {
      setBusy(false);
    }
  }

  function editCalibrationFromSynthesis() {
    openCalSynthHydrateDoneRef.current = false;
    openCalSynthHydrateInFlightRef.current = false;
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
    setStep(4);
    setSynthesis([]);
    setSynthShown(0);
  }

  async function editCalibrationFromActivation() {
    day0ActivationHydrateDoneRef.current = false;
    day0ActivationHydrateInFlightRef.current = false;
    openCalSynthHydrateDoneRef.current = false;
    openCalSynthHydrateInFlightRef.current = false;
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
          : "Could not unlock Conexa calibration for editing.",
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
    setStep(4);
    setSynthesis([]);
    setSynthShown(0);
    setActivation(null);
    setActShown(0);
    setBusy(false);
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
    if (firstPath === "signup_execution") {
      // No validation needed for Path B
    } else if (firstPath === "declaration") {
      const t = decl.trim();
      if (t.length < 30 || t.length > 140) {
        setBusy(false);
        setErr(
          `Declaration must be 30-140 characters after trimming (you have ${t.length}).`,
        );
        window.alert(
          `Your declaration needs at least 30 characters (maximum 140). You currently have ${t.length}. Add one or two clear sentences about what you shipped or what you are committing to.`,
        );
        return;
      }
    }
    if (firstPath === "upload") {
      const t = uploadContext.trim();
      if (t.length < 30 || t.length > 140) {
        setBusy(false);
        setErr(
          `Context must be 30-140 characters after trimming (you have ${t.length}).`,
        );
        return;
      }
      if (uploadProofFiles.length < 1) {
        setBusy(false);
        setErr("Choose at least one file to upload.");
        return;
      }
    }
    let body: Record<string, unknown>;
    if (firstPath === "declaration") {
      body = {
        path: "declaration",
        declaration_text: decl.trim(),
        category: workCat,
      };
    } else if (firstPath === "upload") {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setBusy(false);
        setErr("Your session expired. Sign in again.");
        return;
      }
      let upload_paths: string[];
      try {
        upload_paths = await uploadFirstProofFiles(
          supabase,
          session.user.id,
          uploadProofFiles,
        );
      } catch (e) {
        setBusy(false);
        setErr(
          e instanceof Error
            ? e.message
            : "Could not upload files. Run the entry-uploads storage migration (10MB limit) in Supabase, then try again.",
        );
        return;
      }
      body = {
        path: "upload",
        context_text: uploadContext.trim(),
        category: workCat,
        upload_paths,
      };
    } else if (firstPath === "signup_execution") {
      body = { path: "signup_execution" };
    } else {
      body = { path: "verified", url: proofUrl.trim(), category: workCat };
    }

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
    isSubmittedRef.current = true;
    setIsSubmitted(true);
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
    setFirstName("");
    setLastName("");
    setPassword("");
  }

  if (booting) {
    return (
      <main
        data-onboarding-surface="true"
        className="min-h-screen bg-black flex flex-col items-center justify-center text-[var(--fw)] px-6"
      >
        <p>Loading…</p>
        <AuthMobileHelp afterResetPath="/start" />
      </main>
    );
  }

  const wideOnboarding = step >= 2 && step <= 8;
  /** Match Execution Intelligence HTML: full chrome for every /start step. */
  const useFlowChrome = step >= 2 && step <= 8;
  const calibrationAnswersComplete = CALIBRATION_STEPS.every(
    (s) => cal[s.field].trim().length >= CAL_MIN_SUBMIT_CHARS,
  );
  const startupStepReady =
    Boolean(startupName.trim()) &&
    description.trim().length >= 50 &&
    description.trim().length <= 500 &&
    STAGE_TILES.some((t) => t.stage === stage && t.mrr === mrr) &&
    Boolean(blocker.trim());

  return (
    <main
      data-onboarding-surface="true"
      className={
        useFlowChrome
          ? "ei-root min-h-screen bg-[#111318] text-[#EAEFF8] flex flex-col"
          : "min-h-screen bg-black text-[var(--fw)] px-4 py-10 max-w-lg mx-auto"
      }
    >
      {useFlowChrome ? (
        <div
          className={
            wideOnboarding
              ? "flex flex-1 min-h-0 w-full flex-col md:flex-row"
              : "flex flex-1 min-h-0 w-full flex-col"
          }
        >
      {(step >= 2 && step <= 8) && (
        <>
          <CalibrationSidebar
            phase={onboardingFlowPhase(step)}
            conexaSubtitle={conexaSectionSubtitle(step)}
          />

          <div className="flex flex-1 flex-col min-w-0 min-h-0 bg-[#111318]">
            <MobileStepPills phase={onboardingFlowPhase(step)} />

            <div className="flex-1 min-h-0 overflow-y-auto w-full">
            {step === 2 && (
              <div className="flex min-h-full flex-col md:items-center py-4 md:py-8 px-4 md:px-6 pb-10">
                <div className="w-full max-w-[560px] bg-[#111318]">
                  <div className="pt-1 pb-5 border-b border-white/[0.06]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#4F46E5] mb-2">
                      {hasAuthSession ? "Account" : "Identity"}
                    </p>
                    <h1
                      className="text-[26px] font-extrabold text-[#EAEFF8] tracking-[-0.02em] mb-2"
                      style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
                    >
                      {hasAuthSession ? "Finish your profile" : "Create your account"}
                    </h1>
                    <p className="text-[13px] font-light text-ox-t2 leading-relaxed">
                      {hasAuthSession
                        ? "Add the details below so we can create your Oxecute profile."
                        : "Next you&apos;ll share what you&apos;re building, then Conexa calibration and your first proof."}
                    </p>
                  </div>
                  <div className="py-7 space-y-4">
                    {hasAuthSession ? (
                      <p className="text-[13px] text-ox-t2">
                        You&apos;re signed in. Complete your profile to continue.
                      </p>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-ox-t2 mb-1.5">
                          First name
                        </label>
                        <input
                          className="w-full rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] focus:ring-0 placeholder:text-[13px] placeholder:font-semibold placeholder:font-urbanist placeholder:leading-snug placeholder:text-[var(--ox-placeholder)]"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-ox-t2 mb-1.5">
                          Last name
                        </label>
                        <input
                          className="w-full rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] focus:ring-0 placeholder:text-[13px] placeholder:font-semibold placeholder:font-urbanist placeholder:leading-snug placeholder:text-[var(--ox-placeholder)]"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ox-t2 mb-1.5">Email</label>
                      <input
                        className="w-full rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] focus:ring-0 disabled:opacity-60 placeholder:text-[13px] placeholder:font-semibold placeholder:font-urbanist placeholder:leading-snug placeholder:text-[var(--ox-placeholder)]"
                        placeholder="you@startup.com"
                        type="email"
                        value={email}
                        readOnly={hasAuthSession}
                        onChange={(e) => !hasAuthSession && setEmail(e.target.value)}
                      />
                    </div>
                    {!hasAuthSession ? (
                      <div>
                        <label className="block text-[11px] font-medium text-ox-t2 mb-1.5">Password</label>
                        <p className="text-[10px] font-dm text-ox-t3 mb-1.5">Minimum 6 characters.</p>
                        <input
                          className="w-full rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] focus:ring-0 placeholder:text-[var(--ox-placeholder)]"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    ) : null}
                    <div>
                      <label className="block text-[11px] font-medium text-ox-t2 mb-1.5">Country</label>
                      <select
                        className="w-full rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] focus:ring-0 cursor-pointer"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        aria-label="Country"
                      >
                        <option value="" className="bg-[#1C1F2A] text-ox-t2">
                          Select country
                        </option>
                        {country &&
                        !countryOptions.some((o) => o.name === country) ? (
                          <option value={country} className="bg-[#1C1F2A]">
                            {country}
                          </option>
                        ) : null}
                        {countryOptions.map((o) => (
                          <option key={o.code} value={o.name} className="bg-[#1C1F2A]">
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ox-t2 mb-2">How did you find us?</label>
                      <div className="flex flex-wrap gap-2">
                        {FOUND_US.map((f) => (
                          <button
                            key={f}
                            type="button"
                            className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                              foundUs === f
                                ? "border-[rgba(124,100,220,0.35)] bg-[rgba(124,100,220,0.1)] text-[#EAEFF8]"
                                : "border-white/[0.11] text-ox-t2 hover:border-white/20"
                            }`}
                            onClick={() => setFoundUs(f)}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    {err ? <p className="text-sm text-orange-300">{err}</p> : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={runIdentity}
                      className="w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-white bg-[#0EA472] shadow-[0_4px_16px_rgba(14,164,114,0.25)] hover:shadow-[0_4px_20px_rgba(14,164,114,0.35)] disabled:opacity-50 transition-all"
                    >
                      Continue
                    </button>
                    {!hasAuthSession ? (
                      <>
                        <div className="flex items-center gap-3 py-1">
                          <div className="h-px flex-1 bg-white/[0.08]" />
                          <span className="text-[11px] text-ox-t3">or</span>
                          <div className="h-px flex-1 bg-white/[0.08]" />
                        </div>
                        <button
                          type="button"
                          disabled={busy}
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
                      </>
                    ) : (
                      <p className="text-center text-xs text-ox-t3">
                        <button type="button" onClick={() => void signOutAndReset()} className="text-[#4F46E5] underline">
                          Use a different account
                        </button>
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-full max-w-[560px] mt-6 space-y-4">
                  <AuthMobileHelp afterResetPath="/start" />
                  <p className="text-[13px] text-center text-ox-t2">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#4F46E5] underline">
                      Sign in
                    </Link>
                    {!hasAuthSession ? (
                      <>
                        {" · "}
                        <Link href="/auth/forgot-password" className="text-[#4F46E5] underline">
                          Forgot password
                        </Link>
                      </>
                    ) : null}
                  </p>
                  <div className="flex justify-center">
                    <Link
                      href="/"
                      className="text-[13px] text-ox-t2 border border-white/[0.11] rounded-[9px] px-4 py-2 hover:bg-white/[0.04]"
                    >
                      Back to site
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
                <div className="flex min-h-full flex-col md:items-center py-4 md:py-8 px-4 md:px-6 pb-8 md:pb-10">
                  <div className="w-full max-w-[560px] md:mx-auto shrink-0 space-y-6">
                    <header className="space-y-3 border-b border-white/[0.06] pb-6">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#4F46E5] font-dm">
                        Tell us about your startup
                      </p>
                      <h1
                        className="text-[26px] font-extrabold text-[#EAEFF8] tracking-[-0.02em] font-urbanist leading-tight"
                        style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
                      >
                        What are you building?
                      </h1>
                      <p className="text-[13px] font-light text-ox-t2 font-dm leading-relaxed">
                        Three quick questions. No pitch required. Conexa uses this to give you
                        something real, not generic advice.
                      </p>
                    </header>

                    <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0EA472] to-[#059669] transition-[width] duration-300 ease-in-out"
                        style={{
                          width: `${
                            (Number(Boolean(startupName.trim())) +
                              Number(
                                description.trim().length >= 50 &&
                                  description.trim().length <= 500,
                              ) +
                              Number(
                                STAGE_TILES.some(
                                  (t) => t.stage === stage && t.mrr === mrr,
                                ),
                              ) +
                              Number(Boolean(blocker.trim()))) *
                            25
                          }%`,
                        }}
                      />
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-[11px] font-medium font-dm text-ox-t2 mb-1.5">
                          Startup name
                        </label>
                        <input
                          className="w-full rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm font-dm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] focus:ring-0 placeholder:text-[13px] placeholder:font-semibold placeholder:font-urbanist placeholder:leading-snug placeholder:text-[var(--ox-placeholder)]"
                          placeholder="e.g. Oxecute"
                          value={startupName}
                          onChange={(e) => setStartupName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium font-dm text-ox-t2 mb-1.5">
                          What are you building and who is it for?
                        </label>
                        <p className="text-[10px] font-dm text-ox-t3 mb-1.5">
                          Minimum 50 characters · maximum 500 (after trimming).
                        </p>
                        <textarea
                          className={`w-full min-h-[120px] md:min-h-[100px] rounded-[10px] bg-white/[0.04] border px-[14px] py-[11px] text-sm font-dm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] focus:ring-0 placeholder:text-[13px] placeholder:font-semibold placeholder:font-urbanist placeholder:leading-snug placeholder:text-[var(--ox-placeholder)] ${
                            description.trim().length > 0 &&
                            (description.trim().length < 50 ||
                              description.trim().length > 500)
                              ? "border-amber-500/50"
                              : "border-white/[0.11]"
                          }`}
                          maxLength={500}
                          placeholder="Oxecute is the verified execution record that turns how a founder builds into something that speaks for them."
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value);
                            if (
                              e.target.value.trim().length >= 50 &&
                              e.target.value.trim().length <= 500
                            ) {
                              setContextTooShort(false);
                            }
                          }}
                        />
                        {contextTooShort ? (
                          <p className="text-xs text-amber-300 mt-1" role="alert">
                            50–500 characters required.
                          </p>
                        ) : null}
                        <p className="text-[11px] font-dm text-ox-t3 mt-1">
                          {description.length}/500
                        </p>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium font-dm text-ox-t2 mb-2">
                          What stage are you at?
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {STAGE_TILES.map((t) => {
                            const sel = stage === t.stage && mrr === t.mrr;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setStage(t.stage);
                                  setMrr(t.mrr);
                                }}
                                className={`rounded-[10px] border px-3 py-3 text-left transition font-dm ${
                                  sel
                                    ? "border-[rgba(124,100,220,0.35)] bg-[rgba(124,100,220,0.1)] text-[#EAEFF8]"
                                    : "border-white/[0.11] bg-white/[0.02] text-ox-t2 hover:border-white/20"
                                }`}
                              >
                                <div
                                  className={`text-[13px] font-medium ${sel ? "text-[#EAEFF8]" : "text-ox-t2"}`}
                                >
                                  {t.title}
                                </div>
                                <div className="text-[10px] text-ox-t3 mt-0.5">
                                  {t.sub}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium font-dm text-ox-t2 mb-1.5">
                          What&apos;s your biggest blocker right now?
                        </label>
                        <p className="text-[10px] font-dm text-ox-t3 mb-1.5">Required — a short honest line is enough.</p>
                        <textarea
                          className="w-full min-h-[100px] md:min-h-[80px] rounded-[10px] bg-white/[0.04] border border-white/[0.11] px-[14px] py-[11px] text-sm font-dm text-[#EAEFF8] outline-none transition focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] focus:ring-0 placeholder:text-[13px] placeholder:font-semibold placeholder:font-urbanist placeholder:leading-snug placeholder:text-[var(--ox-placeholder)]"
                          placeholder="Be honest. Conexa reads this literally."
                          value={blocker}
                          onChange={(e) => setBlocker(e.target.value)}
                        />
                      </div>
                    </div>
                    {err ? <p className="text-sm text-orange-300">{err}</p> : null}
                    <button
                      type="button"
                      onClick={() => {
                        if (!startupStepReady) return;
                        void trySaveContext();
                      }}
                      className={`startup-next-btn mt-2 w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold font-dm text-white relative overflow-hidden transition-all duration-200 flex items-center justify-center gap-2 bg-[#0EA472] ${
                        startupStepReady
                          ? "ready opacity-100 cursor-pointer shadow-[0_4px_16px_rgba(14,164,114,0.25)] hover:shadow-[0_4px_20px_rgba(14,164,114,0.35)]"
                          : "opacity-45 cursor-not-allowed"
                      }`}
                    >
                      Next — Conexa calibration
                    </button>
                    <p className="text-[11px] font-dm text-ox-t3 text-center">
                      No account yet. You see your report first.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="mt-6 text-[13px] font-dm text-ox-t2 border border-white/[0.11] rounded-[9px] px-4 py-2.5 hover:bg-white/[0.04] w-full max-w-[560px] md:mx-auto shrink-0"
                  >
                    Back to site
                  </button>
                </div>
            )}

            {step === 4 && (
                <>
                {!calSubmitting ? (
                      <div className="flex min-h-full flex-col md:items-center py-4 md:py-8 px-4 md:px-6 pb-8 md:pb-10">
                        <div className="w-full max-w-[560px] md:mx-auto shrink-0 space-y-6">
                          <header className="space-y-3 pb-6">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#0EA472] font-dm">
                              Conexa calibration
                            </p>
                            <h1
                              className="text-[26px] font-extrabold text-[#EAEFF8] tracking-[-0.02em] font-urbanist leading-tight"
                              style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
                            >
                              Three honest answers.
                            </h1>
                            <p className="text-[13px] font-light text-ox-t2 font-dm leading-relaxed">
                              Conexa reads these literally. The more specific you are, the sharper your
                              report. Don&apos;t perform — this isn&apos;t a pitch. Each answer needs a minimum of{" "}
                              {CAL_MIN_SUBMIT_CHARS} characters (up to {CALIBRATION_STEPS[0].maxLen} each).
                            </p>
                          </header>

                          <div className="h-1 w-full max-w-full rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0EA472] to-[#059669] transition-[width] duration-300 ease-in-out"
                              style={{
                                width: `${
                                  (CALIBRATION_STEPS.filter(
                                    (s) => cal[s.field].trim().length >= CAL_MIN_SUBMIT_CHARS,
                                  ).length /
                                    CALIBRATION_STEPS.length) *
                                  100
                                }%`,
                              }}
                            />
                          </div>

                          <p className="text-[11px] font-dm text-ox-t3">
                            Move through in order. Each answer needs at least {CAL_MIN_SUBMIT_CHARS}{" "}
                            characters before you can generate your report.
                          </p>

                          <div className="space-y-4">
                            {CALIBRATION_STEPS.map((meta, i) => {
                              const field = meta.field;
                              const prev = CALIBRATION_STEPS[i - 1];
                              const unlocked =
                                i === 0 ||
                                (prev &&
                                  cal[prev.field].trim().length >= CAL_UNLOCK_CHARS);
                              return (
                                <CalibrationQuestionCard
                                  key={field}
                                  index={i}
                                  totalSteps={CALIBRATION_STEPS.length}
                                  meta={meta}
                                  field={field}
                                  value={cal[field]}
                                  unlocked={unlocked}
                                  minChars={CAL_MIN_SUBMIT_CHARS}
                                  onChange={(f, v) =>
                                    setCal((prev) => ({ ...prev, [f]: v }))
                                  }
                                />
                              );
                            })}
                          </div>

                          {err ? (
                            <p className="text-sm text-orange-300">{err}</p>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => {
                              if (!calibrationAnswersComplete) return;
                              void submitCalibrationReport();
                            }}
                            className={`calibration-submit-btn mt-2 w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 bg-[#0EA472] ${
                              calibrationAnswersComplete
                                ? "ready opacity-100 cursor-pointer shadow-[0_4px_16px_rgba(14,164,114,0.25)] hover:shadow-[0_4px_20px_rgba(14,164,114,0.35)]"
                                : "opacity-45 cursor-not-allowed"
                            }`}
                          >
                            Generate my Conexa report
                          </button>

                          <p className="text-[11px] font-dm text-ox-t3 pt-2">
                            <strong className="text-[#EAEFF8] font-semibold">
                              Your answers are private.
                            </strong>{" "}
                            Conexa uses them to generate your Day 0 report.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="mt-6 text-[13px] font-dm text-ox-t2 border border-white/[0.11] rounded-[9px] px-4 py-2.5 hover:bg-white/[0.04] w-full max-w-[560px] md:mx-auto shrink-0"
                        >
                          ← Back
                        </button>
                      </div>
                ) : (
                  <div className="flex min-h-[40vh] w-full items-center justify-center py-12 px-4">
                    <CalibrationLoadingState />
                  </div>
                )}
                </>
            )}

            {step === 5 && (
              <div className="flex min-h-full w-full flex-col md:items-center py-4 md:py-8 px-4 md:px-6 pb-10">
            <div className="w-full max-w-[min(92vw,52rem)] rounded-2xl border border-white/[0.11] bg-[#0d0f1a] shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="px-6 md:px-8 pt-7 pb-5 border-b border-white/[0.06]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#0EA472] mb-2">
                  Synthesis
                </p>
                <h1
                  className="text-[26px] font-extrabold text-[#EAEFF8] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
                >
                  Your calibration read
                </h1>
              </div>
              <div className="px-6 md:px-8 py-7 space-y-4">
          {synthLoading ? (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center space-y-3">
              <div className="flex justify-center">
                <span className="inline-block h-8 w-8 rounded-full border-2 border-[#0EA472] border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-ox-t2">
                Generating your synthesis from your calibration answers… This usually takes a few seconds.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {synthesis.slice(0, synthShown).map((s, i) => {
                const collapsed = synthCollapsed[i] === true;
                return (
                  <div key={i} className="border border-white/[0.08] rounded-lg bg-white/[0.02] overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-[#EAEFF8] hover:bg-white/[0.04]"
                      onClick={() =>
                        setSynthCollapsed((prev) => ({
                          ...prev,
                          [i]: !collapsed,
                        }))
                      }
                    >
                      <span>
                        Insight {i + 1} of {Math.max(synthesis.length, 1)}
                      </span>
                      <span className="text-xs font-medium text-[#0EA472] shrink-0">
                        {collapsed ? "Show" : "Hide"}
                      </span>
                    </button>
                    {!collapsed ? (
                      <p className="text-sm text-ox-t2 px-3 pb-3 whitespace-pre-wrap break-words">
                        {s}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          <button
            disabled={
              busy ||
              synthLoading ||
              synthesis.length === 0 ||
              synthShown < synthesis.length
            }
            onClick={() => void confirmSynthesis()}
            className="w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-white bg-[#0EA472] shadow-[0_4px_16px_rgba(14,164,114,0.25)] hover:shadow-[0_4px_20px_rgba(14,164,114,0.35)] disabled:opacity-50 transition-all"
          >
            Yes, continue
          </button>
          <button
            type="button"
            disabled={synthesis.length === 0 || synthShown < synthesis.length}
            onClick={editCalibrationFromSynthesis}
            className="w-full min-h-[48px] rounded-[10px] border border-white/[0.11] text-ox-t2 font-medium hover:bg-white/[0.04] disabled:opacity-50 transition-colors"
          >
            Edit my answers
          </button>
          <p className="text-[11px] text-center text-ox-t3">
            You&apos;ll return to the three Conexa calibration questions, then see a fresh synthesis.
          </p>
              </div>
            </div>
          </div>
            )}

            {step === 7 && !activation && (
              <div className="flex min-h-full w-full flex-col items-center justify-center py-16 px-4">
            <div className="w-full max-w-[min(92vw,52rem)] rounded-2xl border border-white/[0.11] bg-[#0d0f1a] shadow-[0_24px_60px_rgba(0,0,0,0.45)] px-8 py-12 text-center">
              <p className="text-[10px] font-semibold tracking-[0.13em] uppercase text-[#0EA472] mb-3">
                Conexa
              </p>
              <p className="text-[15px] text-ox-t2">Preparing your execution read…</p>
              <div className="flex justify-center py-8">
                <span className="inline-block h-10 w-10 rounded-full border-2 border-[#0EA472] border-t-transparent animate-spin" />
              </div>
            </div>
          </div>
            )}

            {step === 7 && activation && (
              <div className="flex min-h-full w-full flex-col md:items-center py-4 md:py-8 px-4 md:px-6 pb-10">
            <div className="w-full max-w-[min(92vw,52rem)] rounded-2xl border border-white/[0.11] bg-[#0d0f1a] shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="px-6 md:px-8 pt-7 pb-5 border-b border-white/[0.06]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#0EA472] mb-2">
                  Conexa · Execution intelligence
                </p>
                <h1
                  className="text-[26px] font-extrabold text-[#EAEFF8] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
                >
                  Your Day 0 read
                </h1>
                <p className="text-[13px] font-light text-ox-t2 leading-relaxed mt-2">
                  Six tabs unlock as they&apos;re revealed.
                </p>
              </div>
              <div className="px-6 md:px-8 py-7 space-y-4">
          <div className="space-y-2 text-sm">
            {(
              [
                ["The Reality Check", activation.tabs.reality_check],
                ["The Blindspot", activation.tabs.blindspot],
                ["Shipping vs. Noise", activation.tabs.shipping_vs_noise],
                ["The Next Move", activation.tabs.next_move],
                ["The Integrity Forecast", activation.tabs.integrity_forecast],
                ["Executive Synthesis", activation.tabs.executive_synthesis],
              ] as const
            ).slice(0, actShown).map(([t, b], i) => {
              const collapsed = actCollapsed[i] === true;
              return (
                <div key={i} className="border border-white/[0.08] rounded-lg overflow-hidden bg-white/[0.02]">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-white/[0.04]"
                    onClick={() =>
                      setActCollapsed((prev) => ({ ...prev, [i]: !collapsed }))
                    }
                  >
                    <span className="font-semibold text-[#0EA472]">{t}</span>
                    <span className="text-xs font-medium text-[#0EA472] shrink-0">
                      {collapsed ? "Show" : "Hide"}
                    </span>
                  </button>
                  {!collapsed ? (
                    <p className="text-ox-t2 px-3 pb-3 whitespace-pre-wrap break-words">
                      {String(b ?? "")}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          {actShown >= 6 && (
            <>
              <p className="text-sm text-[#EAEFF8]">{activation.personal_insight}</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void editCalibrationFromActivation()}
                className="w-full min-h-[48px] rounded-[10px] border border-white/[0.11] text-ox-t2 font-medium hover:bg-white/[0.04] disabled:opacity-50"
              >
                Edit Conexa calibration answers
              </button>
              <p className="text-[11px] text-ox-t3">
                Reopens the three questions, then synthesis, and this Conexa read runs again with your updates.
              </p>
              <button
                type="button"
                onClick={persistActivationAndGo}
                className="w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-white bg-[#0EA472] shadow-[0_4px_16px_rgba(14,164,114,0.25)] hover:shadow-[0_4px_20px_rgba(14,164,114,0.35)]"
              >
                Start my record
              </button>
            </>
          )}
              </div>
            </div>
          </div>
            )}

            {step === 8 && isSubmitted && (
              <div className="flex min-h-full w-full flex-col md:items-center py-4 md:py-8 px-4 md:px-6 pb-10">
                <div className="w-full max-w-[560px] rounded-2xl border border-white/[0.11] bg-[#0d0f1a] shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden">
                  <div className="px-6 md:px-8 pt-7 pb-5 border-b border-white/[0.06] flex flex-col items-center text-center space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-400 tracking-wide uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      RECORD STARTED
                    </span>
                    <h1
                      className="text-[26px] font-extrabold text-[#EAEFF8] tracking-[-0.02em]"
                      style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
                    >
                      Record started.
                    </h1>
                    <p className="text-[13px] font-light text-ox-t2 leading-relaxed">
                      Entry #001 is locked permanently to your record.
                    </p>
                  </div>
                  <div className="px-6 md:px-8 py-7 space-y-5 flex flex-col items-center text-center">
                    <p className="text-sm text-[var(--ca)] leading-relaxed">
                      Your verified execution record is officially active. This gap-less record is permanent, public, and append-only.
                    </p>
                    <div className="w-full space-y-3 pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const link = `${window.location.origin}/u/${username}`;
                            await navigator.clipboard.writeText(link);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
                      >
                        {copiedLink ? "✓ Copied public link!" : "Share my record"}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-[var(--mi)] bg-[#DEF408] shadow-[0_4px_16px_rgba(222,244,8,0.25)] hover:shadow-[0_4px_20px_rgba(222,244,8,0.35)] transition-all flex items-center justify-center"
                      >
                        Open dashboard
                      </button>
                    </div>
                  </div>
                </div>
                {/* Milestone track */}
                <div className="mt-8 flex flex-col items-center w-full max-w-[560px]">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium flex-wrap justify-center">
                    <span className="text-emerald-400 font-bold">● 1 day executed</span>
                    <span className="text-zinc-700">——</span>
                    <span>○ 21 days executed</span>
                    <span className="text-zinc-700">——</span>
                    <span>○ 60 days executed</span>
                    <span className="text-zinc-700">——</span>
                    <span>○ 90 days executed</span>
                  </div>
                </div>
              </div>
            )}

            {step === 8 && !isSubmitted && firstPath === "signup_execution" && (
              <div className="flex min-h-full w-full flex-col md:items-center py-4 md:py-8 px-4 md:px-6 pb-10">
                <div className="w-full max-w-[560px] rounded-2xl border border-white/[0.11] bg-[#0d0f1a] shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden">
                  <div className="px-6 md:px-8 pt-7 pb-5 border-b border-white/[0.06] space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#4F46E5]">
                      Path B
                    </p>
                    <h1
                      className="text-[26px] font-extrabold text-[#EAEFF8] tracking-[-0.02em]"
                      style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
                    >
                      That&apos;s fine.
                    </h1>
                    <p className="text-[13px] font-light text-ox-t2 leading-relaxed">
                      Signing up is your Day 1 execution. Your record starts today.
                    </p>
                  </div>
                  <div className="px-6 md:px-8 py-7 space-y-5">
                    <p className="text-sm text-[var(--ca)] leading-relaxed">
                      Signing up is your Day 1 execution. Your record starts today. Submit your first real proof from the dashboard when your window opens.
                    </p>
                    {err ? <p className="text-[var(--orange)] text-sm">{err}</p> : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void submitFirst()}
                      className="w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-white bg-[#0EA472] shadow-[0_4px_16px_rgba(14,164,114,0.25)] hover:shadow-[0_4px_20px_rgba(14,164,114,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Continue to my record →
                    </button>
                    <button
                      type="button"
                      onClick={() => setFirstPath("verified")}
                      className="w-full text-center text-xs text-zinc-400 hover:text-white underline pt-1"
                    >
                      ← Back to proof options
                    </button>
                  </div>
                </div>
                {/* Milestone track */}
                <div className="mt-8 flex flex-col items-center w-full max-w-[560px]">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium flex-wrap justify-center">
                    <span className="text-emerald-400 font-bold">● 1 day executed</span>
                    <span className="text-zinc-700">——</span>
                    <span>○ 21 days executed</span>
                    <span className="text-zinc-700">——</span>
                    <span>○ 60 days executed</span>
                    <span className="text-zinc-700">——</span>
                    <span>○ 90 days executed</span>
                  </div>
                </div>
              </div>
            )}

            {step === 8 && !isSubmitted && firstPath !== "signup_execution" && (
              <div className="flex min-h-full w-full flex-col md:items-center py-4 md:py-8 px-4 md:px-6 pb-10">
            <div className="w-full max-w-[560px] rounded-2xl border border-white/[0.11] bg-[#0d0f1a] shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="px-6 md:px-8 pt-7 pb-5 border-b border-white/[0.06] space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#4F46E5]">
                  First entry
                </p>
                <h1
                  className="text-[26px] font-extrabold text-[#EAEFF8] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}
                >
                  Submit your first proof.
                </h1>
                <p className="text-[13px] font-light text-ox-t2 leading-relaxed">
                  Your record starts the moment you submit. Choose your path.
                </p>
              </div>
              <div className="px-6 md:px-8 py-7 space-y-5">

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setFirstPath("verified");
                setUploadProofFiles([]);
                setUploadContext("");
              }}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                firstPath === "verified"
                  ? "border-[var(--ac)] bg-[var(--ac)]/5"
                  : "border-white/10 bg-black/20 hover:border-white/20"
              }`}
            >
              <div className="flex gap-3">
                <span className="mt-0.5 text-[var(--ac)]" aria-hidden>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6 9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>
                  <span className="block font-semibold text-[var(--fw)]">Verified Proof</span>
                  <span className="mt-1 block text-xs text-[var(--ca)] leading-snug">
                    External URL · HEAD request validates immediately · Full Signal Score weight
                  </span>
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFirstPath("declaration");
                setUploadProofFiles([]);
                setUploadContext("");
              }}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                firstPath === "declaration"
                  ? "border-[var(--ac)] bg-[var(--ac)]/5"
                  : "border-white/10 bg-black/20 hover:border-white/20"
              }`}
            >
              <div className="flex gap-3">
                <span className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-[var(--ac)]" aria-hidden />
                <span>
                  <span className="block font-semibold text-[var(--fw)]">Declaration</span>
                  <span className="mt-1 block text-xs text-[var(--ca)] leading-snug">
                    Stated intent · 30–140 chars · Upgrade within 30 days
                  </span>
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFirstPath("upload");
                setProofUrl("");
                setDecl("");
              }}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                firstPath === "upload"
                  ? "border-[var(--ac)] bg-[var(--ac)]/5"
                  : "border-white/10 bg-black/20 hover:border-white/20"
              }`}
            >
              <div className="flex gap-3">
                <span className="mt-0.5 text-[var(--ac)]" aria-hidden>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                </span>
                <span>
                  <span className="block font-semibold text-[var(--fw)]">Upload</span>
                  <span className="mt-1 block text-xs text-[var(--ca)] leading-snug">
                    File upload · PDF, DOCX, PNG, PPTX, XLSX · Max 10MB each · Up to 3 files
                  </span>
                </span>
              </div>
            </button>
          </div>

          {/* Path B link */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={handleChoosePathB}
              className="text-[13px] text-zinc-400 hover:text-[#DEF408] transition-colors"
            >
              I don&apos;t have anything to submit yet →
            </button>
          </div>

          {firstPath === "verified" && (
            <div className="space-y-3">
              <input
                className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2.5 text-[var(--fw)] placeholder:text-[var(--ox-placeholder)]"
                placeholder="https://…"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300 whitespace-nowrap">
                  Verified proof · Live
                </span>
                <p className="text-xs text-[var(--ca)]">Highest Signal weight when the URL validates.</p>
              </div>
            </div>
          )}

          {firstPath === "declaration" && (
            <div className="space-y-3">
              <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--ca)] leading-relaxed">
                What are you building today? What will prove it&apos;s done? · 30–140 chars
              </label>
              <div className="relative">
                <textarea
                  className={`w-full min-h-[128px] rounded-lg bg-black/30 border px-3 py-2 pr-3 pb-9 text-[var(--fw)] placeholder:text-[var(--ox-placeholder)] ${
                    decl.trim().length > 0 && decl.trim().length < 30
                      ? "border-amber-500/50"
                      : "border-white/10"
                  }`}
                  placeholder="Be specific."
                  maxLength={140}
                  value={decl}
                  onChange={(e) => setDecl(e.target.value)}
                />
                <span className="absolute bottom-2 right-3 text-xs tabular-nums text-[var(--t3)]">
                  {decl.length}/140
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/35 bg-amber-950/40 px-3 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-200 whitespace-nowrap">
                  Declaration · Pending
                </span>
                <p className="text-xs text-[var(--ca)]">
                  Upgrade within 30 days with a Verified Proof URL.
                </p>
              </div>
            </div>
          )}

          {firstPath === "upload" && (
            <div className="space-y-3">
              <span className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--ca)]">
                Upload file
              </span>
              <input
                ref={uploadProofInputRef}
                type="file"
                multiple
                accept={FIRST_PROOF_ACCEPT}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--fw)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ac)] file:px-3 file:py-2 file:text-[var(--mi)] file:text-xs file:font-semibold"
                onChange={(e) => {
                  const files = e.target.files
                    ? Array.from(e.target.files).slice(0, 3)
                    : [];
                  setUploadProofFiles(files);
                }}
              />
              {uploadProofFiles.length > 0 ? (
                <ul className="text-xs text-[var(--ca)] space-y-1 list-disc list-inside">
                  {uploadProofFiles.map((f, i) => (
                    <li key={`${f.name}-${i}`}>
                      {f.name} ({Math.round(f.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              ) : null}

              <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--ca)] leading-relaxed">
                What was made? · 30–140 chars required
              </label>
              <div className="relative">
                <textarea
                  className={`w-full min-h-[100px] rounded-lg bg-black/30 border px-3 py-2 pb-9 text-[var(--fw)] placeholder:text-[var(--ox-placeholder)] ${
                    uploadContext.trim().length > 0 && uploadContext.trim().length < 30
                      ? "border-amber-500/50"
                      : "border-white/10"
                  }`}
                  placeholder="Context sentence…"
                  maxLength={140}
                  value={uploadContext}
                  onChange={(e) => setUploadContext(e.target.value)}
                />
                <span className="absolute bottom-2 right-3 text-xs tabular-nums text-[var(--t3)]">
                  {uploadContext.length}/140
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-violet-500/35 bg-violet-950/35 px-3 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-200 whitespace-nowrap">
                  Submission · Unverified
                </span>
                <p className="text-xs text-[var(--ca)]">
                  Link a Verified Proof within 30 days for full Signal weight.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--ca)]">
              Work type
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["product", "Product"] as const,
                  ["distribution", "Distribution"] as const,
                  ["ops", "Ops"] as const,
                ]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setWorkCat(id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                    workCat === id
                      ? "border-blue-400/50 bg-blue-950/80 text-white"
                      : "border-white/20 text-[var(--ca)] hover:border-[var(--ac)]/45"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {err ? <p className="text-[var(--orange)] text-sm">{err}</p> : null}

          <button
            type="button"
            disabled={
              busy ||
              (firstPath === "verified" && proofUrl.trim().length < 8) ||
              (firstPath === "declaration" &&
                (decl.trim().length < 30 || decl.trim().length > 140)) ||
              (firstPath === "upload" &&
                (uploadProofFiles.length < 1 ||
                  uploadContext.trim().length < 30 ||
                  uploadContext.trim().length > 140))
            }
            onClick={() => void submitFirst()}
            className="w-full min-h-[48px] rounded-[10px] text-[14px] font-semibold text-white bg-[#0EA472] shadow-[0_4px_16px_rgba(14,164,114,0.25)] hover:shadow-[0_4px_20px_rgba(14,164,114,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Start My record
          </button>
              </div>
            </div>
            {/* Milestone track */}
            <div className="mt-8 flex flex-col items-center w-full max-w-[560px]">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium flex-wrap justify-center">
                <span className="text-emerald-400 font-bold">● 1 day executed</span>
                <span className="text-zinc-700">——</span>
                <span>○ 21 days executed</span>
                <span className="text-zinc-700">——</span>
                <span>○ 60 days executed</span>
                <span className="text-zinc-700">——</span>
                <span>○ 90 days executed</span>
              </div>
            </div>
          </div>
            )}
            </div>
          </div>
        </>
      )}
    </div>
  ) : null}
    </main>
  );
}
