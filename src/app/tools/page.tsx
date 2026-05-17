import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";

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
    title: "Sales & Market",
    tools: [
      { name: "Calendly", Logo: LogoCalendly },
      { name: "Typeform", Logo: LogoTypeform },
    ],
  },
];

function ToolCard({ name, Logo }: ToolDef) {
  return (
    <div className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)] flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="shrink-0 rounded-lg border border-[var(--bdr)] bg-[var(--sur2)] p-2 flex items-center justify-center">
          <Logo />
        </div>
        <p className="font-semibold text-[var(--t1)]">{name}</p>
      </div>
      <button
        type="button"
        disabled
        className="mt-auto rounded-lg border border-[var(--bdr)] py-2 text-xs font-medium text-[var(--t3)] cursor-not-allowed w-full"
      >
        Connect
      </button>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <AuthenticatedShell breadcrumb="Tools / Connect Tools">
      <main className="max-w-4xl space-y-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--t1)]">
          <span className="text-[var(--t3)] font-semibold">Coming Soon</span> Connect Tools
        </h1>

        <div className="space-y-10">
          {SECTIONS.map((sec) => (
            <section key={sec.num} className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--t1)]">
                {sec.num} · {sec.title}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {sec.tools.map((t) => (
                  <ToolCard key={t.name} {...t} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </AuthenticatedShell>
  );
}
