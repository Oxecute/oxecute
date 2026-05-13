import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";

export default function LockedSignalPage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / Signal Score">
      <main className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Signal Score</h1>
        <p className="text-[var(--t2)]">
          Your execution record, quantified. This unlocks after you complete 21 verified days and move onto
          Builder tier.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--t2)]">
          <li>Hit 21 days executed on your Founder Operating Record.</li>
          <li>Choose Builder - Signal Score weights verified proof and consistency.</li>
          <li>Conexa reads your full record to surface momentum, gaps, and compounding.</li>
        </ol>
        <p className="text-sm font-medium text-[var(--t1)]">
          Progress: keep executing - you&apos;ll see the exact count on your dashboard.
        </p>
      </main>
    </AuthenticatedShell>
  );
}
