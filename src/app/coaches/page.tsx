import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";
import { WaitlistBlock } from "@/components/app/WaitlistBlock";

export default function CoachesPage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / Coaches">
      <main className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Coaches</h1>
        <p className="text-[var(--t2)]">
          1:1 operator coaching layered on your execution record - gated, scarce, and pegged to verified days
          so advice stays grounded in what you actually shipped.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--t2)]">
          <li>We start with founders who already have a dense FOR (21+ verified days).</li>
          <li>Matching blends stage, category mix, and the avoidance map Conexa sees in your record.</li>
          <li>Calendar and pricing publish when the first cohort opens.</li>
        </ol>
        <p className="text-sm font-medium text-[var(--t1)]">Status: Coming Soon</p>
        <WaitlistBlock featureSlug="coaches" title="Waitlist · Coaches cohort" />
      </main>
    </AuthenticatedShell>
  );
}
