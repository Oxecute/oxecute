/**
 * Email template builders for Oxecute.
 * All emails signed "— Ashwinni" and designed for Resend.
 */

export interface EmailUser {
  email: string;
  first_name: string;
  execution_count?: number;
  break_count?: number;
  last_submission_date?: string;
  execution_rate?: number;
  referral_code?: string;
  conexa_day1_personal_insight?: string;
  conexa_day14_read?: string;
  profile_public?: boolean;
  username?: string;
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Urbanist', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #0A0A1A; background: #F2F2F8; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 40px; border-radius: 12px; }
    .header { margin-bottom: 24px; }
    .footer { margin-top: 32px; border-top: 1px solid #EBEBF4; padding-top: 16px; font-size: 13px; color: #5A5A7A; }
    a { color: #010261; text-decoration: none; }
    .button { display: inline-block; padding: 12px 24px; background: #DEF408; color: #000; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    ${body}
    <div class="footer">
      — Ashwinni<br>
      Oxecute · Execution is the credential<br>
      <a href="https://oxecute.com">oxecute.com</a>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// MILESTONE EMAILS
// ============================================================================

export function welcomeEmail(user: EmailUser): { subject: string; html: string } {
  const insight = user.conexa_day1_personal_insight || "Your baseline is logged.";

  return {
    subject: "your record is live",
    html: wrapHtml(`
      <p>Hey ${user.first_name},</p>
      <p>Entry #001 is locked. Cannot be edited or deleted. Ever.</p>
      <p><strong>Here's what Conexa read about you today:</strong></p>
      <p><em>${insight}</em></p>
      <p>Your dashboard: <a href="https://oxecute.com/dashboard">oxecute.com/dashboard</a><br>
      Your execution window opens at midnight.</p>
    `),
  };
}

export function windowClosingReminderEmail(user: EmailUser): { subject: string; html: string } {
  const execCount = user.execution_count ?? 0;

  return {
    subject: "4 hours left",
    html: wrapHtml(`
      <p>Hey ${user.first_name},</p>
      <p>Your window closes at midnight. You're on <strong>${execCount} days executed</strong>.</p>
      <p>If you built something today — submit the proof before it closes.</p>
      <p>If you haven't, that's a break mark. It's part of the record. It's okay. Just don't let it compound.</p>
      <p><a href="https://oxecute.com/dashboard" class="button">Go to Dashboard</a></p>
    `),
  };
}

export function day7Email(user: EmailUser): { subject: string; html: string } {
  return {
    subject: "7 days executed",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p>You've executed 7 days.</p>
      <p><strong>Two things just unlocked:</strong></p>
      <ol>
        <li>Upvote and comment on feature requests: <a href="https://oxecute.com/board">oxecute.com/board</a></li>
        <li>Your referral link is live. One founder onboards through it = 25% off your first month at 21 days executed.</li>
      </ol>
      <p>Your link: <code>oxecute.com/signup?ref=${user.referral_code}</code></p>
    `),
  };
}

export function day14Email(user: EmailUser): { subject: string; html: string } {
  const insight = user.conexa_day14_read || "Your execution pattern is emerging.";

  return {
    subject: "halfway",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p><strong>14 days executed. You're halfway to 21.</strong></p>
      <p><em>${insight}</em></p>
      <p>21 days executed unlocks Signal Score, Daily Directive, and 5 more Conexa tabs.</p>
      <p><a href="https://oxecute.com/dashboard" class="button">View Dashboard</a></p>
    `),
  };
}

export function day21Email(user: EmailUser): {
  subject: string;
  html: string;
} {
  const hasReward = Boolean(user.referral_code); // simplified check

  return {
    subject: "21 days executed. Here's what just opened.",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p><strong>21 days executed.</strong></p>
      <p><strong>What just unlocked on your dashboard:</strong></p>
      <ol>
        <li>Signal Score</li>
        <li>Daily Directive</li>
        <li>5 more Conexa intelligence tabs</li>
        <li>Builder tier — $29/month, locked at this price while you stay active</li>
      </ol>
      ${
        hasReward
          ? `<p>You've also earned a referral reward from your shares. Applied at checkout.</p>`
          : `<p>Refer 1 founder before you subscribe and get 25% off this month.<br>Your link: <code>oxecute.com/signup?ref=${user.referral_code}</code></p>`
      }
      <p><a href="https://oxecute.com/dashboard" class="button">Unlock What You Earned</a></p>
    `),
  };
}

export function day45Email(user: EmailUser): { subject: string; html: string } {
  return {
    subject: "45 days executed. Community just opened.",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p><strong>45 days executed.</strong></p>
      <p>Founders at your stage who've also hit 45 days are now visible to you in the Community tab. Not a feed. Not a leaderboard. Just founders building at the same stage, available to connect one-to-one if you both choose.</p>
      <p><a href="https://oxecute.com/dashboard" class="button">View Community</a></p>
    `),
  };
}

// ============================================================================
// REFERRAL EMAILS
// ============================================================================

export function referral1OnboardedEmail(user: EmailUser, onboardedCount: number, paidCount: number): {
  subject: string;
  html: string;
} {
  return {
    subject: "someone just onboarded through your link",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p>One founder just onboarded through your referral link.</p>
      <p><strong>25% off your first month is locked.</strong> Yours at 21 days executed.</p>
      <p>Current: <strong>${onboardedCount} onboarded · ${paidCount} subscribed</strong>. Next: 3 onboarded = 50% off.</p>
    `),
  };
}

export function referral3OnboardedEmail(user: EmailUser, paidCount: number): {
  subject: string;
  html: string;
} {
  return {
    subject: "3 founders onboarded",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p><strong>3 founders have onboarded through your link.</strong> 50% off your first month is locked.</p>
      <p>${paidCount} have subscribed. 3 subscriptions within 30 days of their signup = 3 months free for you.</p>
    `),
  };
}

export function referral5OnboardedEmail(user: EmailUser): { subject: string; html: string } {
  return {
    subject: "5 founders onboarded. One month free locked.",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p><strong>5 founders onboarded.</strong> Your first month free is locked. No code needed at 21 days executed checkout.</p>
    `),
  };
}

export function referral3PaidEmail(user: EmailUser): { subject: string; html: string } {
  return {
    subject: "3 months free credited",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p><strong>3 of your referrals subscribed.</strong> 3 months free just landed in your account.</p>
    `),
  };
}

export function referral5PaidEmail(user: EmailUser): { subject: string; html: string } {
  return {
    subject: "50% off for 3 months applied",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p><strong>5 referral subscriptions confirmed.</strong> 50% off for 3 months applied to your next billing cycle.</p>
    `),
  };
}

// ============================================================================
// ZERO-REFERRER SCHEDULE (no referrals yet)
// ============================================================================

export function zeroReferrerDay7Email(user: EmailUser): { subject: string; html: string } {
  return {
    subject: "your referral link",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p>Your referral link: <code>oxecute.com/signup?ref=${user.referral_code}</code></p>
      <p>1 founder onboards through it = 25% off your first month.</p>
    `),
  };
}

export function zeroReferrerDay14Email(user: EmailUser): { subject: string; html: string } {
  return {
    subject: "one message",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p>1 onboarded = 25% off. 3 onboarded = 50% off. 5 onboarded = a month free.</p>
      <p>Your link: <code>oxecute.com/signup?ref=${user.referral_code}</code></p>
    `),
  };
}

export function zeroReferrerDay21Email(user: EmailUser): { subject: string; html: string } {
  return {
    subject: "you're about to pay $29",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p>Refer 1 founder before you subscribe and pay $21.75 instead. Refer 3 and pay $14.50.</p>
      <p>Your link: <code>oxecute.com/signup?ref=${user.referral_code}</code></p>
    `),
  };
}

export function zeroReferrerDay28Email(user: EmailUser): { subject: string; html: string } {
  return {
    subject: "paid referrals",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p>3 of your referrals subscribing within 30 days of their signup = 3 months free for you. You have 0.</p>
      <p>Your link: <code>oxecute.com/signup?ref=${user.referral_code}</code></p>
    `),
  };
}

export function zeroReferrerDay35Email(user: EmailUser): { subject: string; html: string } {
  return {
    subject: "last one",
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p>1 founder onboards through your link = 25% off your next month. After this we'll stop reminding you.</p>
      <p>Your link: <code>oxecute.com/signup?ref=${user.referral_code}</code></p>
    `),
  };
}

// ============================================================================
// ACTIVE REFERRER RECURRING (every 7 days after Day 28)
// ============================================================================

export function activeReferrerRecurringEmail(
  user: EmailUser,
  dayNumber: number,
  onboardedCount: number,
  paidCount: number,
  nextTierText: string
): { subject: string; html: string } {
  return {
    subject: `referral update — Day ${dayNumber}`,
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p><strong>${onboardedCount} founders onboarded through your link. ${paidCount} have subscribed.</strong></p>
      <p>${nextTierText}</p>
      <p>Your link: <code>oxecute.com/signup?ref=${user.referral_code}</code></p>
    `),
  };
}

// ============================================================================
// SUNDAY WEEKLY BRIEF (every Sunday 23:59 UTC)
// ============================================================================

export function sundayWeeklyBriefEmail(
  user: EmailUser,
  weekNumber: number,
  weeklyExec: number,
  weeklyBreaks: number,
  productPct: number,
  distributionPct: number,
  opsPct: number,
  dayNumber: number
): { subject: string; html: string } {
  const distributionWarning =
    distributionPct < 20 ? `<p><strong>Distribution at ${distributionPct}%. The gap is widening.</strong></p>` : "";
  const productWarning = productPct === 100 ? `<p><strong>100% product this week. Nothing market-facing.</strong></p>` : "";

  return {
    subject: `week ${weekNumber} — ${dayNumber} days executed`,
    html: wrapHtml(`
      <p>${user.first_name},</p>
      <p><strong>Week ${weekNumber}.</strong></p>
      <p>Days executed this week: <strong>${weeklyExec} of 7</strong><br>
      Breaks: <strong>${weeklyBreaks}</strong><br>
      Category: <strong>${productPct}% product · ${distributionPct}% distribution · ${opsPct}% ops</strong></p>
      ${distributionWarning}
      ${productWarning}
      <p>Total: <strong>${dayNumber} days executed · ${user.break_count ?? 0} breaks.</strong></p>
      <p><a href="https://oxecute.com/dashboard" class="button">View Dashboard</a></p>
    `),
  };
}
