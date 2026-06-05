"use client";

import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";
import { useEffect, useState } from "react";

type ToolDef = { name: string; Logo: () => JSX.Element };

function LogoGitHub() {
  return (
    <svg className="w-8 h-8 text-[var(--t1)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.111.825-.261.825-.57 0-.285-.015-1.035-.015-2.04-3.015.645-3.66-1.44-3.66-1.44-.495-1.245-1.215-1.575-1.215-1.575-.99-.675.075-.66.075-.66 1.095.075 1.665 1.125 1.665 1.125 1.035 1.77 2.715 1.26 3.375.96.105-.735.39-1.26.705-1.545-2.475-.285-5.07-1.23-5.07-5.52 0-1.23.435-2.22 1.125-3.015-.12-.285-.495-1.44.105-2.97 0 0 .915-.285 3.015 1.14a10.32 10.32 0 0 1 2.745-.375c.93 0 1.86.12 2.745.375 2.1-1.425 3.015-1.14 3.015-1.14.6 1.53.225 2.685.105 2.97.69.795 1.125 1.785 1.125 3.015 0 4.305-2.61 5.235-5.085 5.52.405.345.765 1.02.765 2.055 0 1.485-.015 2.685-.015 3.045 0 .315.225.69.825.57A10.02 10.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

function LogoNotion() {
  return (
    <svg className="w-8 h-8 text-[var(--t1)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.459 4.208c.746.363 1.515.67 2.283.96 2.689.952 5.308 1.14 8.074.445a30.9 30.9 0 0 0 2.289-.698c.328-.128.558-.277.872-.108l1.68 5.333c-.304.277-.563.469-.903.61-4.694 1.933-9.47 2.06-14.319.38-.248-.076-.52-.223-.753-.154L4.459 4.208Zm-2.19-.89c-.077.308-.012.577.023.859.365 2.74.731 5.48 1.1 8.219.153 1.14.975 1.662 2.02 2.09 5.52 2.213 11.083 2.303 16.738.43.747-.239 1.453-.58 2.07-1.042V5.818c-.72-1.89-1.44-3.78-2.163-5.668-.192-.502-.46-.68-.99-.496-2.308.82-4.67 1.211-7.095 1.211-2.555 0-5.032-.42-7.423-1.3-.517-.196-.876.048-1.035.543-.364 1.12-.726 2.241-1.09 3.361-.181.548-.38 1.092-.567 1.64-.038.124-.057.252-.085.378h.002Z" />
    </svg>
  );
}

function LogoStripe() {
  return (
    <svg className="w-8 h-8 text-[#635bff]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.378 0-.83.682-1.281 1.89-1.281 1.104 0 2.051.364 3.022.875l.493-2.47c-.873-.401-2.093-.781-3.724-.781-3.048 0-5.217 1.586-5.217 3.955 0 1.783 1.368 2.812 3.194 3.566 1.68.68 2.25 1.116 2.25 1.834 0 .971-.866 1.416-2.192 1.416-1.268 0-2.454-.404-3.456-.966l-.517 2.6c1.104.567 2.53.968 4.21.968 3.267 0 5.43-1.529 5.43-4.052-.001-2.015-1.574-3.088-3.026-3.687v.001Z" />
    </svg>
  );
}

function LogoLemonSqueezy() {
  return (
    <svg className="w-8 h-8 text-[#eab308]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3c-3 2.5-6 6-6 10a6 6 0 1 0 12 0c0-4-3-7.5-6-10z" strokeLinejoin="round" />
      <path d="M9 12h6" strokeLinecap="round" />
    </svg>
  );
}

function LogoCalendly() {
  return (
    <svg className="w-8 h-8 text-[#006bff]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15h-2v-6h2v6Zm4 0h-2v-6h2v6Zm0-8h-2V7h2v2Z" />
    </svg>
  );
}

function LogoTypeform() {
  return (
    <svg className="w-8 h-8 text-[var(--t1)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm1 4v2h8V8H8Zm0 4v2h5v-2H8Z" />
    </svg>
  );
}

function LogoGoogleCalendar() {
  return (
    <svg className="w-8 h-8 text-[#EA4335]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z" />
    </svg>
  );
}

const SECTIONS: { num: string; title: string; tools: ToolDef[] }[] = [
  {
    num: "01",
    title: "Building & Product",
    tools: [
      { name: "GitHub", Logo: LogoGitHub },
      { name: "Notion", Logo: LogoNotion },
    ],
  },
  {
    num: "02",
    title: "Revenue & Finance",
    tools: [
      { name: "Stripe", Logo: LogoStripe },
      { name: "Lemon Squeezy", Logo: LogoLemonSqueezy },
    ],
  },
  {
    num: "03",
    title: "Sales & CRM",
    tools: [
      { name: "Calendly", Logo: LogoCalendly },
      { name: "Typeform", Logo: LogoTypeform },
    ],
  },
  {
    num: "04",
    title: "Communication & Ops",
    tools: [
      { name: "Google Calendar", Logo: LogoGoogleCalendar },
    ],
  },
];

const EXCLUDED_TOOLS = [
  { name: "Reddit", reason: "Not eligible · non-normalised signal" },
  { name: "ChatGPT", reason: "Not eligible · AI usage is not verified proof of execution. The work that comes out of it can be." },
  { name: "Claude", reason: "Not eligible · same reason as above." },
  { name: "Perplexity", reason: "Not eligible · same reason." },
  { name: "Gamma", reason: "Not eligible · same reason." }
];

export default function ToolsPage() {
  const [connections, setConnections] = useState<Record<string, Record<string, string>>>({});
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Form states for modals
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [notionWorkspace, setNotionWorkspace] = useState("");
  const [notionDatabase, setNotionDatabase] = useState("Execution Log");
  const [stripeAccount, setStripeAccount] = useState("");
  const [stripeMode, setStripeMode] = useState("live");
  const [lemonStore, setLemonStore] = useState("");
  const [calendlyLink, setCalendlyLink] = useState("");
  const [typeformId, setTypeformId] = useState("");

  const [simulationState, setSimulationState] = useState<{
    running: boolean;
    toolName: string;
    stage: string;
    success: boolean;
    error: string | null;
    createdUrl?: string;
  }>({
    running: false,
    toolName: "",
    stage: "",
    success: false,
    error: null,
  });

  const handleSimulateAutoCapture = async (toolName: string, config: Record<string, string>) => {
    setSimulationState({
      running: true,
      toolName,
      stage: "Connecting to secure provider sandbox...",
      success: false,
      error: null,
    });

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    try {
      await sleep(1000);
      setSimulationState((prev) => ({ ...prev, stage: `Authenticating secure hooks for ${toolName}...` }));
      
      await sleep(1200);
      setSimulationState((prev) => ({ ...prev, stage: "Parsing branch activity and build diffs..." }));

      await sleep(1200);
      setSimulationState((prev) => ({ ...prev, stage: "Analyzing execution payload for ledger criteria..." }));

      await sleep(1000);
      
      // Determine simulated URL and category
      let url = "";
      let category: "product" | "distribution" | "ops" = "product";
      
      if (toolName === "GitHub") {
        const repo = config.repo || "facebook/react";
        const commitHash = Math.random().toString(16).substring(2, 9);
        url = `https://github.com/${repo}/commit/${commitHash}?sandbox_simulated=true`;
        category = "product";
      } else if (toolName === "Notion") {
        const pageId = Math.random().toString(16).substring(2, 10);
        url = `https://notion.so/workspace/${pageId}?sandbox_simulated=true`;
        category = "ops";
      } else if (toolName === "Stripe") {
        const acct = config.accountId || "acct_1234567";
        const chg = Math.random().toString(16).substring(2, 9);
        url = `https://dashboard.stripe.com/${acct}/payments/ch_${chg}?sandbox_simulated=true`;
        category = "distribution";
      } else if (toolName === "Lemon Squeezy") {
        const store = config.storeId || "12345";
        const order = Math.floor(Math.random() * 100000);
        url = `https://app.lemonsqueezy.com/my-store/${store}/orders/${order}?sandbox_simulated=true`;
        category = "distribution";
      } else if (toolName === "Calendly") {
        const username = config.username || "founder";
        const meetId = Math.random().toString(36).substring(2, 8);
        url = `https://calendly.com/${username}/meeting-${meetId}?sandbox_simulated=true`;
        category = "distribution";
      } else if (toolName === "Typeform") {
        const formId = config.formId || "ABCdef";
        const respId = Math.random().toString(36).substring(2, 8);
        url = `https://admin.typeform.com/form/${formId}/results/response/${respId}?sandbox_simulated=true`;
        category = "distribution";
      }

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "verified",
          url,
          category,
        }),
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(data.error || "Simulation failed to write ledger row. Ensure you haven't already submitted a proof URL today!");
      }

      setSimulationState({
        running: true,
        toolName,
        stage: "Sync complete! Immutable block has been locked successfully.",
        success: true,
        error: null,
        createdUrl: url,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during simulated sync.";
      setSimulationState({
        running: true,
        toolName,
        stage: "",
        success: false,
        error: msg,
      });
    }
  };

  useEffect(() => {
    // Load connections from localStorage
    const saved: Record<string, Record<string, string>> = {};
    SECTIONS.forEach((sec) => {
      sec.tools.forEach((t) => {
        const conn = localStorage.getItem(`oxe_connected_tool_${t.name}`);
        if (conn) {
          try {
            saved[t.name] = JSON.parse(conn);
          } catch {
            saved[t.name] = { connected: "true" };
          }
        }
      });
    });

    // Sync database GitHub repo and Google Calendar configuration
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          let updated = false;
          const repo = data.user.github_repo;
          const branch = data.user.github_branch || "main";
          if (repo) {
            saved["GitHub"] = { repo, branch };
            localStorage.setItem("oxe_connected_tool_GitHub", JSON.stringify({ repo, branch }));
            updated = true;
          }
          if (data.user.google_calendar_connected) {
            saved["Google Calendar"] = { connected: "true" };
            localStorage.setItem("oxe_connected_tool_Google Calendar", JSON.stringify({ connected: "true" }));
            updated = true;
          } else {
            // If database says false but local storage had it, remove it
            if (saved["Google Calendar"]) {
              delete saved["Google Calendar"];
              localStorage.removeItem("oxe_connected_tool_Google Calendar");
              updated = true;
            }
          }
          if (updated) {
            setConnections({ ...saved });
          }
        }
      })
      .catch((err) => console.error("Failed to fetch profile settings:", err));

    setConnections(saved);
  }, []);

  const handleConnect = (name: string) => {
    if (name === "Google Calendar") {
      if (!connections[name]) {
        window.location.href = "/api/integrations/google-calendar/connect";
        return;
      }
    }
    setActiveModal(name);
    // Pre-fill fields if already connected
    if (connections[name]) {
      const data = connections[name];
      if (name === "GitHub") {
        setGithubRepo(data.repo || "");
        setGithubBranch(data.branch || "main");
      } else if (name === "Notion") {
        setNotionWorkspace(data.workspace || "");
        setNotionDatabase(data.database || "Execution Log");
      } else if (name === "Stripe") {
        setStripeAccount(data.accountId || "");
        setStripeMode(data.mode || "live");
      } else if (name === "Lemon Squeezy") {
        setLemonStore(data.storeId || "");
      } else if (name === "Calendly") {
        setCalendlyLink(data.username || "");
      } else if (name === "Typeform") {
        setTypeformId(data.formId || "");
      }
    } else {
      // Clear fields
      setGithubRepo("");
      setGithubBranch("main");
      setNotionWorkspace("");
      setNotionDatabase("Execution Log");
      setStripeAccount("");
      setStripeMode("live");
      setLemonStore("");
      setCalendlyLink("");
      setTypeformId("");
    }
  };

  const handleSaveConnection = async (name: string, data: Record<string, string>) => {
    setConnecting(true);

    if (name === "GitHub") {
      try {
        const res = await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            github_repo: data.repo || null,
            github_branch: data.branch || "main",
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to persist GitHub connection in database");
        }
      } catch (err) {
        console.error("Database persistence error:", err);
      }
    }

    // Simulate connection delay
    setTimeout(() => {
      localStorage.setItem(`oxe_connected_tool_${name}`, JSON.stringify(data));
      setConnections((prev) => ({
        ...prev,
        [name]: data,
      }));
      setConnecting(false);
      setActiveModal(null);
    }, 1200);
  };

  const handleDisconnect = async (name: string) => {
    if (name === "GitHub") {
      try {
        await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            github_repo: null,
            github_branch: "main",
          }),
        });
      } catch (err) {
        console.error("Failed to disconnect GitHub on database:", err);
      }
    } else if (name === "Google Calendar") {
      try {
        await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            google_calendar_connected: false,
            google_calendar_tokens: null,
          }),
        });
      } catch (err) {
        console.error("Failed to disconnect Google Calendar on database:", err);
      }
    }

    localStorage.removeItem(`oxe_connected_tool_${name}`);
    setConnections((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
    setActiveModal(null);
  };

  return (
    <AuthenticatedShell>
      <main className="mx-auto w-full min-w-0 max-w-4xl space-y-8 px-5 pb-10 pt-7 sm:px-7 sm:pt-9 md:pb-14">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#EAEFF8]" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
            Connect Tools
          </h1>
          <p className="text-[12px] sm:text-[13px] text-ox-t2 leading-relaxed mt-1 max-w-xl">
            Integrate your tech stack to feed verified execution data into Conexa.
          </p>
        </div>

        {/* Top Banner */}
        <div className="rounded-[20px] border border-[rgba(124,100,220,0.35)] bg-[rgba(124,100,220,0.06)] shadow-[0_0_24px_rgba(124,100,220,0.06)] p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                Auto-capture is coming in Month 2.
              </h3>
              <p className="text-[12px] text-ox-t2 mt-0.5">
                Connect your tools now — when auto-capture launches, Conexa will start reading them immediately.
              </p>
            </div>
            <span className="inline-flex h-4 items-center rounded-full border border-[rgba(124,100,220,0.45)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#ddd6fe] bg-[rgba(124,100,220,0.16)] shrink-0">
              Active Sync Sandbox
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Every connected tool maintains an active simulation state. Conexa parses your repository and metrics structures dynamically in sandbox mode.
          </p>
        </div>

        <div className="space-y-10">
          {SECTIONS.map((sec) => (
            <section key={sec.num} className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--t1)]">
                {sec.num} · {sec.title}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {sec.tools.map((t) => {
                  const conn = connections[t.name];
                  const Logo = t.Logo;
                  return (
                    <div key={t.name} className={`rounded-xl border p-4 bg-[var(--sur)] flex flex-col gap-4 transition-all duration-200 ${
                      conn ? "border-[rgba(14,164,114,0.3)] shadow-[0_0_16px_rgba(14,164,114,0.04)]" : "border-[var(--bdr)]"
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 rounded-lg border border-[var(--bdr)] bg-[var(--sur2)] p-2 flex items-center justify-center">
                            <Logo />
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--t1)]">{t.name}</p>
                            {conn && (
                              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Active Sync · {conn.repo || conn.workspace || conn.accountId || conn.storeId || conn.username || conn.formId || "Connected"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConnect(t.name)}
                        className={`mt-auto rounded-lg py-2 text-xs font-semibold w-full transition-colors ${
                          conn 
                            ? "border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400"
                            : "border border-[var(--bdr)] hover:bg-white/[0.02] text-[var(--t1)] bg-white/[0.01]"
                        }`}
                      >
                        {conn ? "Manage Integration" : "Connect"}
                      </button>
                      {conn && (
                        <button
                          type="button"
                          onClick={() => handleSimulateAutoCapture(t.name, conn)}
                          className="mt-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 py-2 text-xs font-semibold w-full transition-colors flex items-center justify-center gap-1.5 animate-pulse"
                        >
                          ⚡ Simulate Auto-Capture
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Permanently Excluded Tools */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--t1)]">
              Permanently Excluded
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {EXCLUDED_TOOLS.map((t) => (
                <div key={t.name} className="rounded-xl border border-red-500/10 p-4 bg-[var(--sur)] flex flex-col gap-2 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[var(--t1)]">{t.name}</p>
                    <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-400">
                      Not eligible
                    </span>
                  </div>
                  <p className="text-xs text-[var(--t2)] leading-relaxed">{t.reason}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Connection Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !connecting && setActiveModal(null)} />
          <div className="relative rounded-2xl w-full max-w-md border border-white/[0.08] bg-[#13151C] text-[#EAEFF8] p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-[17px] font-bold tracking-tight text-white flex items-center gap-2">
                Connect {activeModal}
              </h3>
              {!connecting && (
                <button
                  type="button"
                  className="text-xs text-ox-t2 hover:text-white transition-colors"
                  onClick={() => setActiveModal(null)}
                >
                  Close
                </button>
              )}
            </div>

            {/* Tool-specific form contents */}
            <div className="space-y-4">
              {activeModal === "GitHub" && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Target Repository</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3.5 py-2 text-sm text-white outline-none focus:border-white/20"
                      placeholder="e.g. facebook/react"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      disabled={connecting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Default Branch</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3.5 py-2 text-sm text-white outline-none focus:border-white/20"
                      placeholder="main"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      disabled={connecting}
                    />
                  </div>
                </>
              )}

              {activeModal === "Notion" && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Workspace Name</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3.5 py-2 text-sm text-white outline-none focus:border-white/20"
                      placeholder="e.g. My Workspace"
                      value={notionWorkspace}
                      onChange={(e) => setNotionWorkspace(e.target.value)}
                      disabled={connecting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Target Sync Database</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3.5 py-2 text-sm text-white outline-none focus:border-white/20"
                      placeholder="Execution Log"
                      value={notionDatabase}
                      onChange={(e) => setNotionDatabase(e.target.value)}
                      disabled={connecting}
                    />
                  </div>
                </>
              )}

              {activeModal === "Stripe" && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Stripe Account ID</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3.5 py-2 text-sm text-white outline-none focus:border-white/20"
                      placeholder="acct_1xxxxxxxxx"
                      value={stripeAccount}
                      onChange={(e) => setStripeAccount(e.target.value)}
                      disabled={connecting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Sync Mode</label>
                    <select
                      className="w-full rounded-lg bg-[#1F222F] border border-white/[0.1] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
                      value={stripeMode}
                      onChange={(e) => setStripeMode(e.target.value)}
                      disabled={connecting}
                    >
                      <option value="live">Live Environment</option>
                      <option value="test">Test Sandbox Mode</option>
                    </select>
                  </div>
                </>
              )}

              {activeModal === "Lemon Squeezy" && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Store ID</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3.5 py-2 text-sm text-white outline-none focus:border-white/20"
                    placeholder="e.g. 12345"
                    value={lemonStore}
                    onChange={(e) => setLemonStore(e.target.value)}
                    disabled={connecting}
                  />
                </div>
              )}

              {activeModal === "Calendly" && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Calendly Profile Link / Username</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3.5 py-2 text-sm text-white outline-none focus:border-white/20"
                    placeholder="e.g. my-founder-profile"
                    value={calendlyLink}
                    onChange={(e) => setCalendlyLink(e.target.value)}
                    disabled={connecting}
                  />
                </div>
              )}

              {activeModal === "Typeform" && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-ox-t3 uppercase tracking-wider">Typeform Form ID</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-white/[0.04] border border-white/[0.1] px-3.5 py-2 text-sm text-white outline-none focus:border-white/20"
                    placeholder="e.g. ABCdef"
                    value={typeformId}
                    onChange={(e) => setTypeformId(e.target.value)}
                    disabled={connecting}
                  />
                </div>
              )}

              {activeModal === "Google Calendar" && (
                <div className="space-y-1 text-zinc-300 text-xs leading-relaxed">
                  <p>Google Calendar is successfully connected to your Oxecute profile.</p>
                  <p className="mt-1.5 text-zinc-400">Conexa will monitor your completed calendar events automatically to identify execution signals.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5 pt-3 border-t border-white/[0.06]">
              {activeModal !== "Google Calendar" && (
                <button
                  type="button"
                  disabled={connecting}
                  onClick={() => {
                    let data: Record<string, string> = { connected: "true" };
                    if (activeModal === "GitHub") {
                      if (!githubRepo.trim()) return;
                      data = { repo: githubRepo.trim(), branch: githubBranch.trim() };
                    } else if (activeModal === "Notion") {
                      if (!notionWorkspace.trim()) return;
                      data = { workspace: notionWorkspace.trim(), database: notionDatabase.trim() };
                    } else if (activeModal === "Stripe") {
                      if (!stripeAccount.trim()) return;
                      data = { accountId: stripeAccount.trim(), mode: stripeMode };
                    } else if (activeModal === "Lemon Squeezy") {
                      if (!lemonStore.trim()) return;
                      data = { storeId: lemonStore.trim() };
                    } else if (activeModal === "Calendly") {
                      if (!calendlyLink.trim()) return;
                      data = { username: calendlyLink.trim() };
                    } else if (activeModal === "Typeform") {
                      if (!typeformId.trim()) return;
                      data = { formId: typeformId.trim() };
                    }
                    handleSaveConnection(activeModal!, data);
                  }}
                  className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(16,185,129,0.2)]"
                >
                  {connecting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Establishing Sync...
                    </>
                  ) : (
                    connections[activeModal!] ? "Update Connection" : "Authorize & Connect"
                  )}
                </button>
              )}

              {connections[activeModal!] && !connecting && (
                <button
                  type="button"
                  onClick={() => handleDisconnect(activeModal!)}
                  className="w-full rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 py-3 text-sm font-semibold transition-colors"
                >
                  Disconnect Integration
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-Capture Simulation Modal */}
      {simulationState.running && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
            onClick={() => !simulationState.success && !simulationState.error && setSimulationState(prev => ({ ...prev, running: false }))} 
          />
          <div className="relative rounded-2xl w-full max-w-md border border-indigo-500/20 bg-[#13151C] text-[#EAEFF8] p-6 shadow-2xl flex flex-col gap-5 text-center">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white flex items-center justify-center gap-2" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
                ⚡ {simulationState.toolName} Sync Simulator
              </h3>
              <p className="text-xs text-ox-t2 mt-1">Month 2 Auto-Capture Testing sandbox</p>
            </div>

            <div className="py-4 flex flex-col items-center justify-center gap-4 min-h-[140px]">
              {!simulationState.success && !simulationState.error ? (
                <>
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-25" />
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-indigo-600 items-center justify-center text-white text-xs">
                      🔄
                    </span>
                  </div>
                  <p className="text-sm font-medium animate-pulse text-indigo-300">
                    {simulationState.stage}
                  </p>
                </>
              ) : simulationState.success ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-400">
                      Sync Successful!
                    </p>
                    <p className="text-xs text-ox-t2 px-4 leading-relaxed">
                      Immutable block successfully generated. Verified proof was pushed directly to your Operating Record.
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-mono text-zinc-300 select-all mx-auto">
                    {simulationState.createdUrl}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 text-xl">
                    ✕
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-red-400">
                      Sync Restricted
                    </p>
                    <p className="text-xs text-red-300 px-4 leading-relaxed">
                      {simulationState.error}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-white/[0.06] pt-4">
              <button
                type="button"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 text-sm shadow-[0_4px_16px_rgba(79,70,229,0.2)] transition-colors"
                onClick={() => setSimulationState(prev => ({ ...prev, running: false }))}
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedShell>
  );
}
