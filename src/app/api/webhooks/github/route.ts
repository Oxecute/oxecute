import { callAnthropic } from "@/lib/conexa/anthropic";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

interface GitHubCommit {
  id?: string;
  message?: string;
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
  lines_changed?: number;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    // Verify signature if secret is configured
    const signature = request.headers.get("x-hub-signature-256") || "";
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret && signature) {
      if (!verifySignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const eventHeader = request.headers.get("x-github-event") || "";
    
    // Extract user email from payload
    const commits = (payload.commits || []) as GitHubCommit[];
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
    const { data: user, error: userErr } = await admin
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (userErr || !user) {
      console.warn(`[GitHub Webhook] No matching user found for email: ${email}`);
      return NextResponse.json({ ok: true, message: "Email does not match any registered user" });
    }

    // Map event types & verify eligibility
    let mappedEventType = "";
    let weight = 0.0;
    let isEligible = true;
    let externalId = "";
    let description = "";

    if (eventHeader === "push") {
      mappedEventType = "push";
      weight = 0.5;

      const isGeneratedOrLockFile = (filename: string): boolean => {
        const name = filename.toLowerCase();
        return (
          name.endsWith("package-lock.json") ||
          name.endsWith("yarn.lock") ||
          name.endsWith("pnpm-lock.yaml") ||
          name.endsWith("tsconfig.json") ||
          name.includes("node_modules/") ||
          name.includes(".next/") ||
          name.includes("dist/") ||
          name.includes("build/") ||
          name.includes("tsconfig.tsbuildinfo")
        );
      };

      const changedFiles = Array.from(
        new Set([
          ...commits.flatMap((c) => c.added || []),
          ...commits.flatMap((c) => c.modified || []),
          ...commits.flatMap((c) => c.removed || []),
        ])
      );

      const meaningfulFiles = changedFiles.filter((f) => !isGeneratedOrLockFile(f));
      const commitCount = commits.length;

      // Lines changed: read from payload or default to 15 (if meaningful files exist)
      const linesChanged = payload.lines_changed ?? commits.reduce((sum, c) => sum + (c.lines_changed ?? 0), 0);
      const fallbackLines = meaningfulFiles.length > 0 ? 15 : 0;
      const actualLines = linesChanged || fallbackLines;

      // Eligibility: 5+ commits, lines > 10
      isEligible = commitCount >= 5 && actualLines > 10;
      externalId = payload.after || `push-${Date.now()}`;
      description = `GitHub push to branch ${payload.ref?.replace("refs/heads/", "") || "main"} with ${commitCount} commits`;
    } else if (eventHeader === "pull_request") {
      const action = payload.action;
      const merged = payload.pull_request?.merged;
      if (action === "closed" && merged === true) {
        mappedEventType = "pull_request.merged";
        weight = 1.0;
        isEligible = true;
        externalId = `pr-${payload.pull_request.id}`;
        description = `GitHub PR #${payload.pull_request.number} merged: ${payload.pull_request.title}`;
      } else {
        return NextResponse.json({ ok: true, message: "Ignored pull_request event (not merged)" });
      }
    } else if (eventHeader === "release") {
      const action = payload.action;
      if (action === "published") {
        mappedEventType = "release.published";
        weight = 1.0;
        isEligible = true;
        externalId = `release-${payload.release.id}`;
        description = `GitHub Release published: ${payload.release.name || payload.release.tag_name}`;
      } else {
        return NextResponse.json({ ok: true, message: "Ignored release event (not published)" });
      }
    } else {
      return NextResponse.json({ ok: true, message: `Ignored unsupported event type: ${eventHeader}` });
    }

    // Log event in integration_events
    const { error: insertErr } = await admin.from("integration_events").insert({
      user_id: user.id,
      source: "github",
      event_type: mappedEventType,
      external_id: externalId,
      payload: payload,
      weight: weight,
      is_eligible: isEligible,
    });

    if (insertErr) {
      console.error("[GitHub Webhook] Failed to log integration event:", insertErr);
      return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
    }

    let synthesisText = "Activity logged.";
    let category: "product" | "distribution" | "ops" = "product";

    if (isEligible) {
      const commitMessages = commits.map((c) => `- ${c.message}`).join("\n");
      const changedFiles = Array.from(
        new Set([
          ...commits.flatMap((c) => c.added || []),
          ...commits.flatMap((c) => c.modified || []),
          ...commits.flatMap((c) => c.removed || []),
        ])
      );

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

GITHUB EVENT:
Event Type: ${mappedEventType}
Description: ${description}
Commit Messages:
${commitMessages || "N/A"}
Changed Files:
${changedFiles.slice(0, 40).join(", ")}`;

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
        const isOps = changedFiles.some(
          (f) =>
            f.includes(".github") ||
            f.includes("docker") ||
            f.includes("package.json") ||
            f.includes("sql")
        );
        const isDist = changedFiles.some(
          (f) => f.includes("marketing") || f.includes("landing") || f.includes("seo") || f.includes("public")
        );
        category = isOps ? "ops" : isDist ? "distribution" : "product";
        synthesisText = `GitHub activity processed: ${description}.`;
      }

      await admin.from("notifications").insert({
        user_id: user.id,
        type: "system",
        title: "Conexa read your GitHub activity",
        body: `${synthesisText}\n\n[Activity logged as ${mappedEventType}]`,
        action_url: "/dashboard",
        read: false,
      });
    }

    return NextResponse.json({
      ok: true,
      mapped_user: user.email,
      event_logged: true,
      is_eligible: isEligible,
      weight,
      category,
      analysis: synthesisText,
    });
  } catch (err) {
    const error = err as Error;
    console.error("[GitHub Webhook] Error in route execution:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
