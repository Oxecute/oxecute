"use client";

import { AuthenticatedShell, useShellUser } from "@/components/app/AuthenticatedShell";
import { WaitlistBlock } from "@/components/app/WaitlistBlock";

function CommunityBody() {
  const user = useShellUser();
  const exec = Number(user.execution_count ?? 0);
  const need = Math.max(0, 45 - exec);

  return (
    <main className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Community</h1>
      <p className="text-[var(--t2)]">
        Browse founders on the same execution spine. Directory and intros unlock after 45 days executed -
        we keep the room small until the habit is real.
      </p>
      <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--t2)]">
        <li>Stay on the daily submission rhythm (UTC window).</li>
        <li>Track progress on your FOR heatmap - 45 verified days is the gate.</li>
        <li>When you cross the gate, your profile can opt into discovery safely.</li>
      </ol>
      <p className="text-sm font-medium text-[var(--t1)]">
        {need === 0
          ? "You've crossed 45 days - full browse ships in a later release; you're in the first cohort."
          : `${need} of 45 executed days to go before Community unlocks.`}
      </p>
      <WaitlistBlock featureSlug="community_45" title="Waitlist · Community directory" />
    </main>
  );
}

export default function LockedCommunityPage() {
  return (
    <AuthenticatedShell breadcrumb="Dashboards / Community">
      <CommunityBody />
    </AuthenticatedShell>
  );
}
