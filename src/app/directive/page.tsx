import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";
import { WaitlistBlock } from "@/components/app/WaitlistBlock";

export default function LockedDirectivePage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / Daily Directive">
      <main className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Daily Directive</h1>
        <p className="text-[var(--t2)]">
          One high-leverage action per day, one proof requirement, every day - once you clear the Day 21
          gate and subscribe to Builder.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--t2)]">
          <li>Complete 21 days executed with verified proof on your record.</li>
          <li>Unlock Builder - directives are tuned to your stage and avoidance patterns.</li>
          <li>Each directive includes a proof hook so the record stays honest.</li>
        </ol>
        <p className="text-sm font-medium text-[var(--t1)]">
          You&apos;re building toward the same gate as Signal - 21 executed days, then Builder.
        </p>
        <WaitlistBlock featureSlug="daily_directive" title="Notify me when Directive opens for my account" />
      </main>
    </AuthenticatedShell>
  );
}
