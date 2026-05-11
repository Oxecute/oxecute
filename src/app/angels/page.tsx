import { AuthenticatedShell } from "@/components/app/AuthenticatedShell";
import { WaitlistBlock } from "@/components/app/WaitlistBlock";

export default function AngelsPage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / Angels">
      <main className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Angels</h1>
        <p className="text-[var(--t2)]">
          Angel network access for founders with proven execution velocity - introduced only after your record
          shows compounding behaviour, not pitch fluff.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--t2)]">
          <li>Minimum bars are tied to executed days and verified proof density.</li>
          <li>Intros are batched; spammy fundraising mode is excluded by design.</li>
          <li>Founders get a concise execution packet angels can scan in under two minutes.</li>
        </ol>
        <p className="text-sm font-medium text-[var(--t1)]">Status: Coming Soon</p>
        <WaitlistBlock featureSlug="angels" title="Waitlist · Angel intros" />
      </main>
    </AuthenticatedShell>
  );
}
