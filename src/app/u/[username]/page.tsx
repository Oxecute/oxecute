import {
  EmbedBadge,
  ProfileHeader,
  ShareCardLocked,
} from "@/components/profile/ProfileSections";
import InteractiveProfileGrid from "@/components/profile/InteractiveProfileGrid";
import { mergeBreakDayNumbers } from "@/lib/break-days";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { executionDayNumber } from "@/lib/dates";
import type { Metadata } from "next";
import React from "react";

export async function generateMetadata(props: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await props.params;
  const admin = createServiceRoleClient();
  const { data: user } = await admin
    .from("users")
    .select("profile_public")
    .eq("username", username)
    .maybeSingle();

  const isPrivate = !user || !user.profile_public;

  return {
    title: `${username} - Oxecute`,
    robots: isPrivate ? "noindex, nofollow" : "index, follow",
  };
}

export default async function PublicProfilePage(props: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await props.params;

  const admin = createServiceRoleClient();
  const { data: user } = await admin
    .from("users")
    .select(
      "id, username, full_name, created_at, founding_member, profile_public, profile_bio, execution_count, break_count, show_breaks, show_signal_score, show_directives, show_completion_rate, show_investor_requests",
    )
    .eq("username", username)
    .maybeSingle();

  if (!user || !user.profile_public) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--t1)]">
        <meta name="robots" content="noindex,nofollow" />
        <p>This record is private.</p>
      </main>
    );
  }

  const [{ data: entries }, { data: breakRows }, { data: breakNotifs }] = await Promise.all([
    admin
      .from("entries")
      .select("day_number, tier, category, url, created_at")
      .eq("user_id", user.id)
      .order("day_number", { ascending: true }),
    admin.from("break_marks").select("day_number").eq("user_id", user.id),
    admin
      .from("notifications")
      .select("title")
      .eq("user_id", user.id)
      .ilike("title", "Break mark written%"),
  ]);

  const showBreaksPublic = Boolean(user.show_breaks ?? true);
  const breakDaysPublic = showBreaksPublic ? mergeBreakDayNumbers(breakRows, breakNotifs) : [];

  const exec = Number(user.execution_count ?? 0);
  const breakCount = Number(user.break_count ?? 0);
  const totalDays = exec + breakCount;
  const executionRate = totalDays > 0 ? Math.round((exec / totalDays) * 100) : 0;
  
  const currentDay = executionDayNumber(String(user.created_at));
  const maxDays = Math.max(30, currentDay);

  const badges = [
    { label: "VERIFIED OPERATOR", reached: exec >= 21 },
    { label: "VERIFIED PATHFINDER", reached: exec >= 60 },
    { label: "VERIFIED SIGNAL", reached: exec >= 90 },
  ];

  const bio = user.profile_bio ? String(user.profile_bio) : null;

  // Toggles
  const showSignal = Boolean(user.show_signal_score);
  const showDirectives = Boolean(user.show_directives);
  const showCompletion = Boolean(user.show_completion_rate);
  const showInvestorRequests = Boolean(user.show_investor_requests);

  // Computed values
  const signalScoreValue = exec >= 21 ? Math.round((exec / Math.max(1, totalDays)) * 100) : null;
  const directivesCount = exec >= 21 ? Math.max(0, exec - 20) : null;
  const completionRateValue = exec >= 21 ? Math.round((exec / Math.max(1, totalDays)) * 100) : null;

  function StatCard({ label, value, isHidden, isLocked }: { label: string; value: React.ReactNode; isHidden: boolean; isLocked: boolean }) {
    if (isHidden) {
      return (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-4 bg-white/[0.01] flex flex-col justify-between min-h-[88px] transition-all">
          <p className="text-[10px] font-semibold text-[var(--t3)] uppercase tracking-wider">{label}</p>
          <p className="text-xs text-zinc-500 italic mt-2">Stat hidden by founder</p>
        </div>
      );
    }
    if (isLocked) {
      return (
        <div className="rounded-xl border border-white/[0.06] p-4 bg-zinc-900/30 flex flex-col justify-between min-h-[88px] opacity-75">
          <p className="text-[10px] font-semibold text-[var(--t3)] uppercase tracking-wider">{label}</p>
          <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5 font-medium">
            <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
            </svg>
            Locked (Day 21)
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)] flex flex-col justify-between min-h-[88px] hover:border-white/[0.15] transition-all">
        <p className="text-[10px] font-semibold text-[var(--t3)] uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-1 text-white font-mono">{value}</p>
      </div>
    );
  }

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
            executionRate={executionRate}
          />

          {bio ? <p className="text-[var(--t2)] text-sm -mt-4 mb-8 max-w-xl">{bio}</p> : null}

          {/* 5 Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-[var(--bdr)] p-4 bg-[var(--sur)] flex flex-col justify-between min-h-[88px] hover:border-white/[0.15] transition-all">
              <p className="text-[10px] font-semibold text-[var(--t3)] uppercase tracking-wider">Days executed</p>
              <p className="text-2xl font-bold mt-1 text-white font-mono">{exec}</p>
            </div>

            <StatCard 
              label="Breaks on record" 
              value={breakCount} 
              isHidden={!showBreaksPublic} 
              isLocked={false} 
            />

            <StatCard 
              label="Signal score" 
              value={signalScoreValue ?? "—"} 
              isHidden={!showSignal} 
              isLocked={exec < 21} 
            />

            <StatCard 
              label="Directives issued" 
              value={directivesCount ?? "—"} 
              isHidden={!showDirectives} 
              isLocked={exec < 21} 
            />

            <StatCard 
              label="Completion rate" 
              value={completionRateValue !== null ? `${completionRateValue}%` : "—"} 
              isHidden={!showCompletion} 
              isLocked={exec < 21} 
            />

            <StatCard 
              label="Investor requests accepted" 
              value="0" 
              isHidden={!showInvestorRequests} 
              isLocked={false} 
            />
          </div>

          <InteractiveProfileGrid
            entries={(entries ?? []).map((e) => ({
              day_number: e.day_number,
              tier: e.tier,
              category: e.category,
              url: e.url,
              created_at: e.created_at,
            }))}
            breakDays={breakDaysPublic}
            userCreatedAt={String(user.created_at)}
            maxDays={maxDays}
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
