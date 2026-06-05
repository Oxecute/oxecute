import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createServiceRoleClient();

    // 1. Fetch user profile
    const { data: profile, error: profileErr } = await admin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    // 2. Fetch score history
    const { data: scoreHistory } = await admin
      .from("signal_score_history")
      .select("*")
      .eq("user_id", user.id)
      .order("score_date", { ascending: true }); // Ascending for chart order


    // 3. Compute current components on the fly
    const thirtyDaysAgoDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
    const [recentBreaks, dirs, userEntries] = await Promise.all([
      admin.from("break_marks").select("id").eq("user_id", user.id).gte("break_date", thirtyDaysAgoDate),
      admin.from("directives").select("status").eq("user_id", user.id),
      admin.from("entries").select("category").eq("user_id", user.id),
    ]);

    const breaksInLast30 = recentBreaks.data?.length ?? 0;
    const directivesIssued = dirs.data?.length ?? 0;
    const directivesCompleted = dirs.data?.filter((d) => d.status === "completed").length ?? 0;
    const categories = new Set(userEntries.data?.map((e) => e.category) ?? []);
    const distinctCategories = categories.size;

    const executionCount = profile.execution_count ?? 0;
    const daysOnRecord = profile.days_on_record ?? 0;

    const rawStreak = daysOnRecord > 0 ? (executionCount / daysOnRecord) * 100 : 0;
    const streakDepth = Math.max(0, rawStreak - breaksInLast30 * 4);
    const directiveCompletion = directivesIssued > 0 ? (directivesCompleted / directivesIssued) * 100 : 0;
    const artifactDiversity = (distinctCategories / 3) * 100;

    const calculatedRawScore = Math.min(100, Math.max(0, Math.round(
      streakDepth * 0.40 + directiveCompletion * 0.35 + artifactDiversity * 0.25
    )));

    // Latest scores from history or calculation
    const latestHistory = scoreHistory && scoreHistory.length > 0 ? scoreHistory[scoreHistory.length - 1] : null;
    const rawScoreVal = latestHistory ? Number(latestHistory.raw_score) : calculatedRawScore;
    const smoothedScoreVal = latestHistory ? Number(latestHistory.smoothed_score) : calculatedRawScore;

    return NextResponse.json({
      latest: {
        raw: rawScoreVal,
        smoothed: smoothedScoreVal,
      },
      components: {
        streak_depth: {
          score: Math.round(streakDepth),
          execution_rate: Math.round(rawStreak),
          breaks_30d: breaksInLast30,
          weight: 40,
        },
        directive_completion: {
          score: Math.round(directiveCompletion),
          completed: directivesCompleted,
          total: directivesIssued,
          weight: 35,
        },
        artifact_diversity: {
          score: Math.round(artifactDiversity),
          categories: Array.from(categories),
          weight: 25,
        },
      },
      history: scoreHistory || [],
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Failed to load Signal details." }, { status: 500 });
  }
}
