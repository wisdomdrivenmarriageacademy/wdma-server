import { Resend, type CreateEmailOptions } from "resend"
import dotenv from "dotenv"
dotenv.config();

// Created on first use: `new Resend("")` throws, which would crash the whole
// API at boot when email isn't configured yet.
let resend: Resend | null = null;
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email (RESEND_API_KEY) is not configured");
  return (resend ??= new Resend(apiKey));
}

type SendEmailParams = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailParams) {
  const fromAddress =
    from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  // Build the email options object, only including defined properties
  // Resend needs html or text; only send the ones provided.
  const emailOptions: CreateEmailOptions = html
    ? { from: fromAddress, to, subject, html, ...(text ? { text } : {}) }
    : { from: fromAddress, to, subject, text: text ?? "" };

  const result = await getResend().emails.send(emailOptions);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export function buildOtpEmailHtml(otp: string) {
  return `
    <div>
      <h2>Your verification code</h2>
      <p>Use the OTP below to complete verification. It expires in 10 minutes.</p>
      <h3 style="font-size:24px;letter-spacing:4px;">${otp}</h3>
    </div>
  `;
}

export function buildPasswordResetEmailHtml(resetLink: string) {
  return `
    <div>
      <h2>Password reset</h2>
      <p>Click the link below to reset your password. It expires in 30 minutes.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
    </div>
  `;
}
