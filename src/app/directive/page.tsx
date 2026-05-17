import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";

export default function LockedDirectivePage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / Daily Directive">
      <main className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Daily Directive</h1>
        <p className="text-base leading-relaxed text-[var(--t2)]">
          One move. Every day. No guessing. Activates after 21 days of execution. Conexa already knows what
          you&apos;re avoiding.
        </p>
      </main>
    </AuthenticatedShell>
  );
}
