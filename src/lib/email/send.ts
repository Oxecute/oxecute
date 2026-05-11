import { Resend } from "resend";

const from =
  process.env.RESEND_FROM_EMAIL ?? "Oxecute <onboarding@resend.dev>";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, error: "no_resend" };
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
