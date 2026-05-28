/**
 * Email service orchestration.
 * Handles sending emails at appropriate lifecycle events
 * and automatically writes matching rows to the notifications table.
 */

import { createServiceRoleClient } from "@/lib/supabase/service";
import { sendEmail } from "./send";
import * as templates from "./templates";

/** Helper to query user by email and insert notification row */
async function writeEmailNotification(
  email: string,
  type: string,
  title: string,
  body: string,
  actionUrl?: string,
) {
  try {
    const admin = createServiceRoleClient();
    const { data: user } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (user) {
      await admin.from("notifications").insert({
        user_id: user.id,
        type,
        title,
        body,
        action_url: actionUrl ?? null,
        read: false,
      });
    }
  } catch (e) {
    console.error("Failed to write notification row: ", e);
  }
}

export async function sendWelcomeEmail(email: string, firstName: string, username: string, insight: string) {
  const template = templates.welcomeEmail({
    email,
    first_name: firstName,
    username,
    conexa_day1_personal_insight: insight,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "system",
    "your record is live",
    `Entry #001 is locked. Conexa insight: ${insight.slice(0, 100)}...`,
    "/dashboard",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendWindowClosingReminderEmail(email: string, firstName: string, executionCount: number) {
  const template = templates.windowClosingReminderEmail({
    email,
    first_name: firstName,
    execution_count: executionCount,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "record",
    "4 hours left",
    `Your window closes at midnight. You're on ${executionCount} days executed.`,
    "/dashboard",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendDay7Email(email: string, firstName: string, referralCode: string) {
  const template = templates.day7Email({
    email,
    first_name: firstName,
    referral_code: referralCode,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "milestone",
    "7 days executed",
    "You can now upvote and comment on feature requests. Your referral link is active.",
    "/board",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendDay14Email(email: string, firstName: string, executionCount: number, insight: string) {
  const template = templates.day14Email({
    email,
    first_name: firstName,
    execution_count: executionCount,
    conexa_day14_read: insight,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "milestone",
    "14 days executed - Conexa mid-point read",
    insight,
    "/dashboard",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendDay21Email(email: string, firstName: string, referralCode: string) {
  const template = templates.day21Email({
    email,
    first_name: firstName,
    referral_code: referralCode,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "milestone",
    "21 days executed - you've earned this",
    "Signal Score, Daily Directive, and Builder tier just unlocked.",
    "/dashboard",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendDay45Email(email: string, firstName: string) {
  const template = templates.day45Email({
    email,
    first_name: firstName,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "milestone",
    "45 days executed - community opens",
    "Founders at your stage who've also executed 45 days are now visible to you.",
    "/dashboard",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendReferral1OnboardedEmail(
  email: string,
  firstName: string,
  onboardedCount: number,
  paidCount: number,
) {
  const template = templates.referral1OnboardedEmail(
    { email, first_name: firstName },
    onboardedCount,
    paidCount,
  );

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    "someone just onboarded through your link",
    `One founder just onboarded through your referral link. 25% off is locked at 21 days.`,
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendReferral3OnboardedEmail(
  email: string,
  firstName: string,
  paidCount: number,
) {
  const template = templates.referral3OnboardedEmail(
    { email, first_name: firstName },
    paidCount,
  );

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    "3 founders onboarded",
    "3 founders have onboarded through your link. 50% off your first month is locked.",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendReferral5OnboardedEmail(email: string, firstName: string) {
  const template = templates.referral5OnboardedEmail({
    email,
    first_name: firstName,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    "5 founders onboarded. One month free locked.",
    "Your first month free is locked. No code needed at 21 days executed checkout.",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendReferral3PaidEmail(email: string, firstName: string) {
  const template = templates.referral3PaidEmail({
    email,
    first_name: firstName,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    "3 months free credited",
    "3 of your referrals subscribed. 3 months free just landed in your account.",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendReferral5PaidEmail(email: string, firstName: string) {
  const template = templates.referral5PaidEmail({
    email,
    first_name: firstName,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    "50% off for 3 months applied",
    "5 referral subscriptions confirmed. 50% off for 3 months applied.",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendZeroReferrerDay7Email(email: string, firstName: string, referralCode: string) {
  const template = templates.zeroReferrerDay7Email({
    email,
    first_name: firstName,
    referral_code: referralCode,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    "Share your referral link",
    `Your referral link: oxecute.com/signup?ref=${referralCode}. 1 founder onboards = 25% off.`,
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendZeroReferrerDay14Email(email: string, firstName: string, referralCode: string) {
  const template = templates.zeroReferrerDay14Email({
    email,
    first_name: firstName,
    referral_code: referralCode,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    "Referral rewards ladder",
    "1 onboarded = 25% off. 3 onboarded = 50% off. 5 onboarded = a month free.",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendZeroReferrerDay21Email(email: string, firstName: string, referralCode: string) {
  const template = templates.zeroReferrerDay21Email({
    email,
    first_name: firstName,
    referral_code: referralCode,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    "Refer 1 founder to save",
    `Refer 1 founder before you subscribe and pay $21.75 instead of $29.`,
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendZeroReferrerDay28Email(email: string, firstName: string, referralCode: string) {
  const template = templates.zeroReferrerDay28Email({
    email,
    first_name: firstName,
    referral_code: referralCode,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    "Earn 3 months free",
    "3 of your referrals subscribing within 30 days of their signup = 3 months free for you.",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendZeroReferrerDay35Email(email: string, firstName: string, referralCode: string) {
  const template = templates.zeroReferrerDay35Email({
    email,
    first_name: firstName,
    referral_code: referralCode,
  });

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    "Final referral reminder",
    "1 founder onboards through your link = 25% off your next month. After this we'll stop reminding you.",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendActiveReferrerRecurringEmail(
  email: string,
  firstName: string,
  referralCode: string,
  dayNumber: number,
  onboardedCount: number,
  paidCount: number,
  nextTierText: string,
) {
  const template = templates.activeReferrerRecurringEmail(
    { email, first_name: firstName, referral_code: referralCode },
    dayNumber,
    onboardedCount,
    paidCount,
    nextTierText,
  );

  // Write notification row
  await writeEmailNotification(
    email,
    "referral",
    `Referral update — Day ${dayNumber}`,
    `${onboardedCount} founders onboarded through your link. ${paidCount} have subscribed.`,
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendSundayWeeklyBriefEmail(
  email: string,
  firstName: string,
  weekNumber: number,
  weeklyExec: number,
  weeklyBreaks: number,
  productPct: number,
  distributionPct: number,
  opsPct: number,
  dayNumber: number,
  breakCount: number,
) {
  const template = templates.sundayWeeklyBriefEmail(
    { email, first_name: firstName, break_count: breakCount },
    weekNumber,
    weeklyExec,
    weeklyBreaks,
    productPct,
    distributionPct,
    opsPct,
    dayNumber,
  );

  // Write notification row
  await writeEmailNotification(
    email,
    "record",
    `Weekly Execution Brief`,
    `Week brief sent to email. Open to see your execution stats.`,
    "/dashboard",
  );

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}
