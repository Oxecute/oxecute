import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";

type ToolCard = { name: string; detail: string };

const BUILDING: ToolCard[] = [
  { name: "GitHub", detail: "Repos & shipping events — Tier 1 verified proof eligible." },
  { name: "GitLab", detail: "Pipelines & merge activity — Tier 1 verified proof eligible." },
  { name: "Linear", detail: "Issues & cycle delivery — Tier 1 verified proof eligible." },
];

const REVENUE: ToolCard[] = [
  { name: "Stripe", detail: "Revenue & MRR signals — Tier 1 revenue truth." },
  { name: "Lemon Squeezy", detail: "Checkout & subscriptions — Tier 1 revenue truth." },
  { name: "QuickBooks", detail: "Books & cash positioning — Tier 1 revenue truth." },
];

const SALES: ToolCard[] = [
  { name: "Calendly", detail: "Meetings booked — Tier 1 market truth." },
  { name: "Apollo", detail: "Outreach & sequences — Tier 1 market truth." },
  { name: "Loom", detail: "Outbound & demo video — Tier 1 market truth." },
];

function ToolSection({
  title,
  subtitle,
  tools,
}: {
  title: string;
  subtitle: string;
  tools: ToolCard[];
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-[var(--t1)]">{title}</h2>
        <p className="text-xs text-[var(--t2)] mt-0.5">{subtitle}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {tools.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)] flex flex-col gap-3"
          >
            <div>
              <p className="font-semibold text-[var(--t1)]">{t.name}</p>
              <p className="text-xs text-[var(--t2)] mt-1 leading-relaxed">{t.detail}</p>
            </div>
            <button
              type="button"
              disabled
              className="mt-auto rounded-lg border border-[var(--bdr)] py-2 text-xs font-medium text-[var(--t3)] cursor-not-allowed w-full"
            >
              Connect
            </button>
            <p className="text-[10px] uppercase tracking-wide text-[var(--t3)] font-medium">
              Coming soon
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ToolsPage() {
  return (
    <AuthenticatedShell breadcrumb="Tools / Connect Tools">
      <main className="max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Connect Tools</h1>
          <p className="text-sm text-[var(--t2)] max-w-2xl leading-relaxed">
            Wire your truth stack before Month 2 auto-capture. OAuth stays off for MVP — connectors activate when
            the integration ships.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur2)] p-4 text-sm text-[var(--t2)] space-y-2">
          <p>
            <strong className="text-[var(--t1)]">Tier 1 tools</strong> can qualify as{" "}
            <strong className="text-[var(--t1)]">Verified Proof</strong> once validation rules are live.{" "}
            <strong className="text-[var(--t1)]">Tier 2</strong> feeds context only until upgraded.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-[var(--t2)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200 mb-1">
            What we never capture
          </p>
          <p>
            Private message bodies, bank credentials, health data, passwords, or anything outside the brief’s
            allow-listed signals.
          </p>
        </div>

        <ToolSection
          title="Building & product"
          subtitle="Tier 1 — verified proof eligible"
          tools={BUILDING}
        />
        <ToolSection
          title="Revenue & finance"
          subtitle="Tier 1 — revenue truth"
          tools={REVENUE}
        />
        <ToolSection title="Sales & market" subtitle="Tier 1 — market truth" tools={SALES} />
      </main>
    </AuthenticatedShell>
  );
}
