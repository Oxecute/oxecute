import { callAnthropic } from "@/lib/conexa/anthropic";
import { sha256Hex } from "@/lib/crypto";
import { executionDayNumber, utcTodayISO } from "@/lib/dates";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

interface GitHubCommit {
  id?: string;
  message: string;
  url?: string;
  author?: {
    name?: string;
    email?: string;
  };
  committer?: {
    name?: string;
    email?: string;
  };
  added?: string[];
  modified?: string[];
  removed?: string[];
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    // Identify details from the push event
    const ref = payload.ref || "";
    const commits = (payload.commits || []) as GitHubCommit[];
    const repository = payload.repository || {};
    const repoName = repository.full_name || "";
    
    if (commits.length === 0) {
      return NextResponse.json({ ok: true, message: "No commits in push event" });
    }

    // Extract email from commit or pusher to map to Oxecute user
    const firstCommit = commits[0];
    const authorEmail = firstCommit?.author?.email || "";
    const committerEmail = firstCommit?.committer?.email || "";
    const pusherEmail = payload.pusher?.email || "";
    const email = (authorEmail || committerEmail || pusherEmail || "").trim();

    if (!email) {
      console.warn("[GitHub Webhook] No email found in payload");
      return NextResponse.json({ ok: true, message: "No email resolved to map user" });
    }

    const admin = createServiceRoleClient();
    
    // Find the user associated with the commit author email
    const { data: user, error: userErr } = await admin
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (userErr || !user) {
      console.warn(`[GitHub Webhook] No matching user found for email: ${email}`);
      return NextResponse.json({ ok: true, message: "Email does not match any registered user" });
    }

    // Branch matching (default to main if not configured)
    const targetBranch = user.github_branch || "main";
    const pushBranch = ref.replace("refs/heads/", "");
    
    // If user has a configured repository connection, verify it matches
    if (user.github_repo) {
      const connectedRepo = user.github_repo.toLowerCase().trim();
      const currentRepo = repoName.toLowerCase().trim();
      if (connectedRepo !== currentRepo) {
        console.info(`[GitHub Webhook] Pushed repo ${repoName} does not match connected repo ${user.github_repo}`);
        return NextResponse.json({ ok: true, message: "Pushed repository does not match user connected repository" });
      }
      
      // Verify branch matches
      if (targetBranch && pushBranch && targetBranch !== pushBranch) {
        console.info(`[GitHub Webhook] Pushed branch ${pushBranch} does not match target branch ${targetBranch}`);
        return NextResponse.json({ ok: true, message: "Pushed branch does not match target branch" });
      }
    } else {
      // Auto-connect repository on first push if not connected via UI
      await admin
        .from("users")
        .update({
          github_repo: repoName,
          github_branch: pushBranch || "main",
        })
        .eq("id", user.id);
      console.info(`[GitHub Webhook] Auto-connected ${repoName} to user ${user.id}`);
    }

    // Aggregate commit details for Conexa analysis
    const commitMessages = commits.map((c) => `- ${c.message}`).join("\n");
    const changedFiles = Array.from(
      new Set([
        ...commits.flatMap((c) => c.added || []),
        ...commits.flatMap((c) => c.modified || []),
        ...commits.flatMap((c) => c.removed || []),
      ])
    );

    // Call Conexa (Claude) to analyze the commit and build product understanding
    const systemPrompt = `You are Conexa, the execution intelligence layer of Oxecute.
You read GitHub push commits from founders and give a direct, cold, and data-driven analysis of their work.
Voice Rules:
1. Write in active, declarative, present-tense sentences. Max 3 sentences.
2. Be direct. No softening. Do not offer encouragement (no "great job", "keep it up", "nice code", "congratulations").
3. Analyze what was shipped based on the commit messages and changed files, and link it directly to the founder's startup description and stage.
4. Categorize the work into exactly one of: "product", "distribution", or "ops".
5. Return ONLY a valid JSON object with two keys: "synthesis" (string, max 3 sentences) and "category" (one of "product", "distribution", "ops"). Do not wrap in markdown, backticks, or write any other text.`;

    const userPrompt = `FOUNDER PROFILE:
Startup Name: ${user.startup_name}
Startup Description: ${user.startup_description}
Stage: ${user.stage}
MRR: ${user.mrr}

GITHUB PUSH:
Repository: ${repoName}
Branch: ${pushBranch}
Commit Messages:
${commitMessages}
Changed Files:
${changedFiles.slice(0, 40).join(", ")}`;

    let synthesisText = "Commit code shipped.";
    let category: "product" | "distribution" | "ops" = "product";

    try {
      const response = await callAnthropic({
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: 300,
      });

      const cleanJsonStr = response.text
        .replace(/```json/i, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanJsonStr);
      if (parsed.synthesis) synthesisText = parsed.synthesis;
      if (parsed.category && ["product", "distribution", "ops"].includes(parsed.category)) {
        category = parsed.category;
      }
    } catch (err) {
      console.error("[GitHub Webhook] Failed to generate AI analysis:", err);
      // Fallback: simple rule-based categorization
      const isOps = changedFiles.some(f => f.includes(".github") || f.includes("docker") || f.includes("package.json") || f.includes("sql"));
      const isDist = changedFiles.some(f => f.includes("marketing") || f.includes("landing") || f.includes("seo") || f.includes("public"));
      category = isOps ? "ops" : isDist ? "distribution" : "product";
      synthesisText = `Commit pushes to ${repoName} processed. ${commits.length} commits verified.`;
    }

    // Auto-record in the entries (ledger) table if the day slot is available
    const today = utcTodayISO();
    const dayNum = executionDayNumber(user.created_at as string, new Date());
    
    // Check if the user already has a submission for the current UTC day
    const { data: existingDayEntry } = await admin
      .from("entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("day_number", dayNum)
      .maybeSingle();

    let entryAdded = false;

    if (!existingDayEntry) {
      // Find last entry number to increment
      const { data: last } = await admin
        .from("entries")
        .select("entry_number")
        .eq("user_id", user.id)
        .order("entry_number", { ascending: false })
        .limit(1)
        .maybeSingle();
        
      const nextEntry = (last?.entry_number ?? 0) + 1;
      const commitUrl = firstCommit?.url || `https://github.com/${repoName}/commit/${firstCommit?.id || ""}`;
      const hash = await sha256Hex(commitUrl + new Date().toISOString());

      const { error: insertErr } = await admin.from("entries").insert({
        user_id: user.id,
        entry_number: nextEntry,
        day_number: dayNum,
        category,
        source_type: "github_push",
        tier: "verified_proof",
        url: commitUrl,
        declaration_text: firstCommit?.message?.slice(0, 140) || `GitHub Push to ${repoName}`,
        validation_hash: hash,
        execution_day: true,
      });

      if (!insertErr) {
        entryAdded = true;
        // Update user execution count
        await admin
          .from("users")
          .update({
            execution_count: (user.execution_count ?? 0) + 1,
            last_submission_date: today,
          })
          .eq("id", user.id);
      } else {
        console.error("[GitHub Webhook] Failed to insert ledger entry:", insertErr);
      }
    }

    // Insert Conexa Analysis Notification
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "system",
      title: "Conexa read your GitHub push",
      body: `${synthesisText}\n\n[Commit Activity: ${commits.length} commit(s) in branch ${pushBranch}]`,
      action_url: "/dashboard",
      read: false,
    });

    return NextResponse.json({
      ok: true,
      mapped_user: user.email,
      entry_added: entryAdded,
      category,
      analysis: synthesisText,
    });
  } catch (err) {
    const error = err as Error;
    console.error("[GitHub Webhook] Error in route execution:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
