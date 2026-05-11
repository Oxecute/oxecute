import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";

export default function ToolsPage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / Connect Tools">
      <main className="max-w-2xl space-y-6">
        <p className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)] text-sm text-[var(--t2)]">
          Auto-capture is coming in Month 2. Connect your tools now - when auto-capture launches, Conexa will
          start reading them immediately.
        </p>
        <h1 className="text-2xl font-bold">Connect Tools</h1>
        <p className="text-[var(--t2)] text-sm">
          All OAuth connects stay disabled for MVP. This page reserves the layout from the brief - buttons
          will light up when integrations ship.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {["GitHub", "Notion", "Linear", "Slack"].map((name) => (
            <div
              key={name}
              className="rounded-xl border border-[var(--bdr)] p-4 opacity-50 bg-[var(--sur)]"
            >
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-[var(--t3)] mt-1">Coming soon</p>
            </div>
          ))}
        </div>
      </main>
    </AuthenticatedShell>
  );
}
