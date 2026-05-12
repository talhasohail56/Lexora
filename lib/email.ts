import nodemailer from "nodemailer";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type EmailResult = { sent: boolean; reason: string | null; provider?: "gmail" | "resend" };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  if (process.env.GMAIL_APP_PASSWORD) {
    return sendWithGmail(input);
  }

  return sendWithResend(input);
}

async function sendWithGmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const user = process.env.GMAIL_USER || process.env.LEXORA_SUPPORT_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return { sent: false, reason: "GMAIL_USER or GMAIL_APP_PASSWORD is not configured", provider: "gmail" };

  const fromName = process.env.EMAIL_FROM_NAME || "Lexora";

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `${fromName} <${user}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: process.env.RESEND_REPLY_TO_EMAIL || process.env.LEXORA_SUPPORT_EMAIL || user,
    });

    return { sent: true, reason: null, provider: "gmail" };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "Gmail SMTP send failed",
      provider: "gmail",
    };
  }
}

async function sendWithResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not configured", provider: "resend" };

  const from = process.env.RESEND_FROM_EMAIL || "Lexora <onboarding@resend.dev>";
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL || process.env.LEXORA_SUPPORT_EMAIL;

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    return {
      sent: false,
      reason: details || `Resend returned ${response.status}`,
      provider: "resend",
    };
  }

  return { sent: true, reason: null, provider: "resend" };
}

export async function sendOtpEmail(input: { to: string; name: string; otp: string }) {
  const safeName = escapeHtml(input.name || "there");
  const safeOtp = escapeHtml(input.otp);

  return sendEmail({
    to: input.to,
    subject: "Your Lexora verification code",
    text: `Your Lexora verification code is ${input.otp}. It expires in 15 minutes.`,
    html: `
      <div style="margin:0;background:#080806;padding:32px;font-family:Inter,Arial,sans-serif;color:#f8f5ee">
        <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:linear-gradient(135deg,#130806,#0b0d09 48%,#2c0b08);padding:28px">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.48)">Lexora verification</div>
          <h1 style="margin:18px 0 10px;font-size:28px;line-height:1.1;color:#fff">Confirm your email</h1>
          <p style="margin:0 0 22px;color:rgba(255,255,255,.62);line-height:1.6">Hi ${safeName}, use this code to finish creating your Lexora account.</p>
          <div style="display:inline-block;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.08);padding:16px 22px;font-size:32px;font-weight:700;letter-spacing:.22em;color:#fff">${safeOtp}</div>
          <p style="margin:22px 0 0;color:rgba(255,255,255,.42);font-size:13px;line-height:1.6">This code expires in 15 minutes. If you did not request it, you can ignore this email.</p>
        </div>
      </div>
    `,
  });
}
