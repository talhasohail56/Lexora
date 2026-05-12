import nodemailer from "nodemailer";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};
type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
};
type EmailResult = { sent: boolean; reason: string | null; provider?: "gmail" | "resend" };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  if (process.env.GMAIL_APP_PASSWORD) {
    return sendWithGmail(input);
  }

  return sendWithResend(input);
}

async function sendWithGmail(input: EmailInput): Promise<EmailResult> {
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
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
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

async function sendWithResend(input: EmailInput): Promise<EmailResult> {
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
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64"),
        content_type: attachment.contentType,
      })),
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
      <div style="margin:0;background:#f6f8f7;padding:40px 20px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#172321">
        <div style="max-width:600px;margin:0 auto">
          <div style="padding:0 0 18px;text-align:center">
            <div style="display:inline-block;border:1px solid #dfe8e5;border-radius:999px;background:#fff;padding:10px 16px;font-size:14px;font-weight:700;letter-spacing:.03em;color:#173d37">⚖ Lexora</div>
          </div>
          <div style="border:1px solid #dce7e2;border-radius:24px;background:#ffffff;box-shadow:0 24px 80px rgba(23,35,33,.10);overflow:hidden">
            <div style="height:5px;background:linear-gradient(90deg,#2f7d72,#e0a52c)"></div>
            <div style="padding:34px 34px 28px">
              <p style="margin:0 0 12px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#2f7d72">Email verification</p>
              <h1 style="margin:0 0 14px;font-size:30px;line-height:1.18;color:#111817">Confirm your Lexora account</h1>
              <p style="margin:0 0 26px;font-size:15px;line-height:1.7;color:#60706d">Hi ${safeName}, enter this verification code to finish creating your AI paralegal workspace.</p>
              <div style="border:1px solid #d9e5e0;border-radius:18px;background:#f7faf9;padding:22px;text-align:center">
                <div style="font-size:38px;line-height:1;font-weight:800;letter-spacing:.28em;color:#111817">${safeOtp}</div>
              </div>
              <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#60706d">This code expires in <strong style="color:#111817">15 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
            </div>
            <div style="border-top:1px solid #edf2f0;background:#fbfcfc;padding:18px 34px;font-size:12px;line-height:1.6;color:#7a8784">
              Lexora never asks for your password or payment information by email. Keep this code private.
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendDraftDocxEmail(input: {
  to: string;
  name: string;
  draftTitle: string;
  filename: string;
  buffer: Buffer;
  contentType: string;
}) {
  const safeName = escapeHtml(input.name || "there");
  const safeTitle = escapeHtml(input.draftTitle);

  return sendEmail({
    to: input.to,
    subject: `Your Lexora draft: ${input.draftTitle}`,
    text: `Hi ${input.name}, your Lexora draft "${input.draftTitle}" is attached as a Word document.`,
    html: `
      <div style="margin:0;background:#f6f8f7;padding:40px 20px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#172321">
        <div style="max-width:620px;margin:0 auto">
          <div style="border:1px solid #dce7e2;border-radius:24px;background:#fff;box-shadow:0 24px 80px rgba(23,35,33,.10);overflow:hidden">
            <div style="height:5px;background:linear-gradient(90deg,#2f7d72,#e0a52c)"></div>
            <div style="padding:34px">
              <p style="margin:0 0 12px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#2f7d72">Lexora draft export</p>
              <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#111817">Your Word draft is attached</h1>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#60706d">Hi ${safeName}, Lexora prepared the draft below as a DOCX attachment.</p>
              <div style="border:1px solid #d9e5e0;border-radius:16px;background:#f7faf9;padding:18px">
                <div style="font-size:13px;color:#60706d">Draft</div>
                <div style="margin-top:4px;font-size:18px;font-weight:700;color:#111817">${safeTitle}</div>
              </div>
              <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#60706d">Review the document carefully before signing, stamping, registering, filing, or sending it to another party.</p>
            </div>
          </div>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: input.filename,
        content: input.buffer,
        contentType: input.contentType,
      },
    ],
  });
}

export async function sendFirmInvitationEmail(input: {
  to: string;
  firmName: string;
  inviterName: string;
  token: string;
  appUrl?: string;
}) {
  const safeFirm = escapeHtml(input.firmName);
  const safeInviter = escapeHtml(input.inviterName);
  const appUrl = (input.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const inviteUrl = `${appUrl}/invite/${encodeURIComponent(input.token)}`;

  return sendEmail({
    to: input.to,
    subject: `${input.inviterName} invited you to ${input.firmName} on Lexora`,
    text: `${input.inviterName} invited you to join ${input.firmName} on Lexora. Accept the invitation: ${inviteUrl}`,
    html: `
      <div style="margin:0;background:#f6f8f7;padding:40px 20px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#172321">
        <div style="max-width:620px;margin:0 auto">
          <div style="border:1px solid #dce7e2;border-radius:24px;background:#fff;box-shadow:0 24px 80px rgba(23,35,33,.10);overflow:hidden">
            <div style="height:5px;background:linear-gradient(90deg,#2f7d72,#e0a52c)"></div>
            <div style="padding:34px">
              <p style="margin:0 0 12px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#2f7d72">Firm workspace invitation</p>
              <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#111817">Join ${safeFirm} on Lexora</h1>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#60706d">${safeInviter} invited you to collaborate inside the firm's legal workspace.</p>
              <div style="border:1px solid #d9e5e0;border-radius:16px;background:#f7faf9;padding:18px">
                <div style="font-size:13px;color:#60706d">Workspace</div>
                <div style="margin-top:4px;font-size:20px;font-weight:700;color:#111817">${safeFirm}</div>
              </div>
              <a href="${inviteUrl}" style="display:block;margin-top:24px;border-radius:14px;background:#111817;color:#fff;text-decoration:none;text-align:center;padding:15px 20px;font-weight:700">Accept invitation</a>
              <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#60706d">Use the same email address that received this invitation. If you do not have a Lexora account yet, you can create one from the invitation page.</p>
            </div>
            <div style="border-top:1px solid #edf2f0;background:#fbfcfc;padding:18px 34px;font-size:12px;line-height:1.6;color:#7a8784">
              This invite only grants access to documents shared with you by the firm.
            </div>
          </div>
        </div>
      </div>
    `,
  });
}
