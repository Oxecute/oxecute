import {
  EmbedBadge,
  ExecutionGrid,
  ExecutionStats,
  ProfileHeader,
  ShareCardLocked,
} from "@/components/profile/ProfileSections";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const RESERVED = new Set([
  "api",
  "auth",
  "dashboard",
  "login",
  "start",
  "board",
  "inbox",
  "tools",
  "settings",
  "signal",
  "directive",
  "community",
  "coaches",
  "angels",
  "_next",
  "favicon.ico",
]);

export async function generateMetadata(props: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await props.params;
  return {
    title: `${username} - Oxecute`,
  };
}

export default async function PublicProfilePage(props: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await props.params;
  if (RESERVED.has(username.toLowerCase())) notFound();

  const admin = createServiceRoleClient();
  const { data: user } = await admin
    .from("users")
    .select(
      "id, username, full_name, created_at, founding_member, profile_public, profile_bio, execution_count, break_count, show_breaks, show_signal_score",
    )
    .eq("username", username)
    .maybeSingle();

  if (!user || !user.profile_public) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--t1)]">
        <p>This record is private.</p>
      </main>
    );
  }

  const { data: entries } = await admin
    .from("entries")
    .select("day_number, tier")
    .eq("user_id", user.id)
    .order("day_number", { ascending: true });

  const exec = Number(user.execution_count ?? 0);
  const badges = [
    { label: "21d verified", reached: exec >= 21 },
    { label: "60d verified", reached: exec >= 60 },
    { label: "90d verified", reached: exec >= 90 },
  ];

  const bio = user.profile_bio ? String(user.profile_bio) : null;
  const showSignal = Boolean(user.show_signal_score);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--t1)] px-4 py-10">
      <div className="max-w-4xl mx-auto lg:grid lg:grid-cols-[1fr_280px] lg:gap-10">
        <div>
          <ProfileHeader
            fullName={String(user.full_name)}
            username={String(user.username)}
            createdAtIso={String(user.created_at)}
            foundingMember={Boolean(user.founding_member)}
            badges={badges}
          />

          {bio ? <p className="text-[var(--t2)] text-sm -mt-4 mb-8 max-w-xl">{bio}</p> : null}

          <ExecutionStats
            executionCount={exec}
            breakCount={Number(user.break_count ?? 0)}
            showBreaks={Boolean(user.show_breaks)}
          />

          {showSignal ? (
            <div className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)] mb-8">
              <p className="text-xs font-semibold text-[var(--t3)] uppercase">Signal score</p>
              <p className="text-2xl font-bold mt-1">…</p>
              <p className="text-xs text-[var(--t3)] mt-2">Quantified execution ships with Builder.</p>
            </div>
          ) : null}

          <ExecutionGrid
            entries={(entries ?? []).map((e) => ({
              day_number: e.day_number,
              tier: e.tier,
            }))}
          />

          <ShareCardLocked daysExecuted={exec} unlocked={exec >= 21} />

          <EmbedBadge username={String(user.username)} />

          <p className="mt-10 text-sm text-[var(--t3)] text-center">
            Execution is the credential · {process.env.NEXT_PUBLIC_APP_URL ?? "oxecute.com"}/
            {user.username}
          </p>
        </div>

        <aside className="hidden lg:block text-sm text-[var(--t2)] space-y-4 mt-4">
          <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur)] p-4">
            <p className="text-xs font-semibold text-[var(--t3)] uppercase mb-2">Public record</p>
            <p>
              Only verified execution tiles and safe profile fields are visible here (Oxecute §11). Owner view
              in the app can surface more context.
            </p>
          </div>
          {exec < 21 ? (
            <div className="rounded-xl border border-[var(--bdr)] bg-[var(--sur2)] p-4">
              <p className="font-medium text-[var(--t1)]">Day 21 milestone</p>
              <p className="mt-2 text-xs">
                Verified operator badge and share surfaces unlock at 21 executed days.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
