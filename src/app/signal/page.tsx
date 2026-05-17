import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";

export default function LockedSignalPage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / Signal Score">
      <main className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Signal Score</h1>
        <div className="space-y-3 text-base leading-relaxed">
          <p className="font-semibold text-[var(--t1)]">Your execution, quantified.</p>
          <p className="font-semibold text-[var(--t1)]">
            Activates after 21 days of execution. Keep going, it&apos;s already watching.
          </p>
        </div>
      </main>
    </AuthenticatedShell>
  );
}
